import { Schema } from '@mysql/xdevapi';
import { load } from 'cheerio';
import {
	AbsenteeInformation,
	CAPMemberContact,
	ExtraMemberInformation,
	MemberAccessLevel,
	MemberPermissions,
	NHQMemberObject,
	NHQMemberReference
} from 'common-lib';
import { MemberCAPWATCHErrors, MemberCreateError } from 'common-lib/index';
import { createWriteStream, existsSync, unlink } from 'fs';
import { get as httpRequest } from 'https';
import { join } from 'path';
import { promisify } from 'util';
import conf from '../../conf';
import Account, { AccountRequest } from '../Account';
import { default as MemberBase, MemberSession, SESSION_TIME } from '../MemberBase';
import { ParamType } from '../MySQLUtil';
import { getPermissions } from '../Permissions';
import CAPWATCHMember from './CAPWATCHMember';
import { nhq as auth } from './pam';
import { USERAGENT } from './pam/nhq-request';
import ProspectiveMember from './ProspectiveMember';

interface NHQMemberSession extends MemberSession {
	memberID: NHQMemberReference;

	contact: CAPMemberContact;
	memberRank: string;
	cookieData: string;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
	seniorMember: boolean;
	squadron: string;
	orgid: number;
	flight: null | string;
}

export { MemberCreateError };

export interface ConditionalMemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: ProspectiveMember | NHQMember | null;
	newSessionID: string | null;
}
export interface MemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: NHQMember | ProspectiveMember;
	newSessionID: string;
}

export default class NHQMember extends CAPWATCHMember implements NHQMemberObject {
	public static async Create(
		username: string | number,
		password: string,
		schema: Schema,
		account: Account
	): Promise<NHQMember> {
		const cookie = await auth.getCookies(username.toString(), password);

		const memberInfo = await Promise.all([
			auth.getName(cookie, username.toString()),
			auth.getContact(cookie)
		]);

		const id = memberInfo[0].capid;
		const [dutyPositions, extraInfo] = await Promise.all([
			NHQMember.GetRegularDutypositions(id, schema),
			NHQMember.LoadExtraMemberInformation(
				{
					id,
					type: 'CAPNHQMember'
				},
				schema,
				account
			)
		]);

		const sess: NHQMemberSession = {
			accountID: account.id,
			expireTime: Date.now() + SESSION_TIME,
			memberID: {
				type: 'CAPNHQMember',
				id
			},

			contact: memberInfo[1],
			cookieData: cookie,
			memberRank: memberInfo[0].rank,
			nameFirst: memberInfo[0].nameFirst,
			nameLast: memberInfo[0].nameLast,
			nameMiddle: memberInfo[0].nameMiddle,
			nameSuffix: memberInfo[0].nameSuffix,
			seniorMember: memberInfo[0].seniorMember,
			squadron: memberInfo[0].squadron,
			orgid: memberInfo[0].orgid,
			flight: extraInfo.flight
		};

		const sessionID = await MemberBase.AddSession(sess, account, schema);

		const permissions = getPermissions(extraInfo.accessLevel);

		return new NHQMember(
			{
				contact: memberInfo[1],
				dutyPositions: [
					...dutyPositions,
					...extraInfo.temporaryDutyPositions.map(v => ({
						duty: v.Duty,
						date: v.assigned,
						type: 'CAPUnit' as 'CAPUnit',
						expires: v.validUntil
					}))
				],
				id,
				memberRank: memberInfo[0].rank,
				nameFirst: memberInfo[0].nameFirst,
				nameLast: memberInfo[0].nameLast,
				nameMiddle: memberInfo[0].nameMiddle,
				nameSuffix: memberInfo[0].nameSuffix,
				seniorMember: memberInfo[0].seniorMember,
				squadron: memberInfo[0].squadron,
				orgid: memberInfo[0].orgid,
				usrID: this.GetUserID([
					memberInfo[0].nameFirst,
					memberInfo[0].nameMiddle,
					memberInfo[0].nameLast,
					memberInfo[0].nameSuffix
				]),
				type: 'CAPNHQMember',
				permissions,
				flight: extraInfo.flight,
				teamIDs: extraInfo.teamIDs,
				sessionID,
				cookie,
				absenteeInformation: extraInfo.absentee,
				accessLevel: extraInfo.accessLevel
			},
			schema,
			account,
			extraInfo
		);
	}

	public static async LoadMemberFromSession(
		session: MemberSession,
		account: Account,
		schema: Schema,
		sessionID: string
	): Promise<NHQMember> {
		const sess = session as NHQMemberSession;

		const [dutyPositions, extraInfo] = await Promise.all([
			NHQMember.GetRegularDutypositions(sess.memberID.id, schema),
			NHQMember.LoadExtraMemberInformation(
				{
					id: sess.memberID.id,
					type: 'CAPNHQMember'
				},
				schema,
				account
			)
		]);

		const permissions = getPermissions(extraInfo.accessLevel);

		return new NHQMember(
			{
				contact: sess.contact,
				dutyPositions: [
					...dutyPositions,
					...extraInfo.temporaryDutyPositions.map(v => ({
						duty: v.Duty,
						date: v.assigned,
						type: 'CAPUnit' as 'CAPUnit',
						expires: v.validUntil
					}))
				],
				id: sess.memberID.id,
				memberRank: sess.memberRank,
				nameFirst: sess.nameFirst,
				nameLast: sess.nameLast,
				nameMiddle: sess.nameMiddle,
				nameSuffix: sess.nameSuffix,
				seniorMember: sess.seniorMember,
				squadron: sess.squadron,
				orgid: sess.orgid,
				usrID: NHQMember.GetUserID([
					sess.nameFirst,
					sess.nameMiddle,
					sess.nameLast,
					sess.nameSuffix
				]),
				type: 'CAPNHQMember',
				permissions,
				flight: sess.flight,
				teamIDs: extraInfo.teamIDs,
				sessionID,
				cookie: sess.cookieData,
				absenteeInformation: extraInfo.absentee,
				accessLevel: extraInfo.accessLevel
			},
			schema,
			account,
			extraInfo
		);
	}

	/**
	 * Limit IDs to CAP IDs
	 */
	public id: number;

	/**
	 * Permissions for the user
	 */
	public permissions: MemberPermissions;
	/**
	 * The access level which determines the permissions
	 */
	public accessLevel: MemberAccessLevel;
	/**
	 * The ID to for the session of the member
	 */
	public sessionID: string;
	/**
	 * How long the member is absent for
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Used to differentiate between members
	 *
	 * The instanceof operator may work as well
	 */
	public type: 'CAPNHQMember' = 'CAPNHQMember';
	/**
	 * The cookie data used to access NHQ
	 */
	public cookie: string;

	private constructor(
		data: NHQMemberObject,
		schema: Schema,
		account: Account,
		extraInfo: ExtraMemberInformation
	) {
		super(data, schema, account, extraInfo);

		this.id = data.id;
		this.cookie = data.cookie;
		this.absenteeInformation = extraInfo.absentee;

		this.accessLevel = extraInfo.accessLevel;
		this.sessionID = data.sessionID;

		if (this.isRioux) {
			this.permissions = getPermissions('Admin');
		} else {
			this.permissions = getPermissions(this.accessLevel);
		}
	}

	public async getCAPWATCHList(): Promise<string[]> {
		const retData: string[] = [];
		let data;
		try {
			data = await auth.request('/cap.capwatch.web/splash.aspx', this.cookie, false);
		} catch (e) {
			throw new Error('Member does not have CAPWATCH list available');
		}

		if (
			typeof data.headers.location !== 'undefined' &&
			data.headers.location === '/cap.capwatch.web/Modules/CapwatchRequest.aspx'
		) {
			throw new Error(MemberCAPWATCHErrors.INVALID_PERMISSIONS.toString());
		}

		data = await auth.request('/cap.capwatch.web/Default.aspx', this.cookie, false);

		const $ = load(data.body);

		// Temporary fix until I actually use select
		// REMOVE ONCE CODE IS IMPLEMENTED
		// @ts-ignore
		const select = $('#OrgChooser');

		const ids = select.find('option');

		for (let i = 1; i < ids.length; i++) {
			retData.push(ids[i].attribs.value);
		}

		return retData;
	}

	public async streamCAPWATCHFile(id: string, stream: NodeJS.WritableStream) {
		const path = `https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?wa=true&unitOnly=0&ORGID=${id}`;

		return new Promise<void>((resolve, reject) => {
			// @ts-ignore
			httpRequest(
				path,
				{
					headers: {
						Accept: '*/*',
						'Accept-Encoding': 'gzip, deflate, br',
						'Accept-Language': 'en-US,en;q=0.5',
						Connection: 'keep-alive',
						Cookie: this.cookie,
						Host: 'www.capnhq.gov',
						'Upgrade-Insecure-Requests': '1',
						'User-Agent': USERAGENT,
						'Content-Type': 'application/json',
						Referrer: 'https://www.capnhq.gov/cap.capwatch.web/Default.aspx'
					}
				},
				// @ts-ignore
				res => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						res.pipe(stream);
						res.on('end', () => {
							resolve();
						});
					} else {
						reject(new Error(MemberCAPWATCHErrors.INVALID_PERMISSIONS.toString()));
					}
				}
			);
		});
	}

	public async getCAPWATCHFile(id: string, location?: string): Promise<string> {
		if (location === undefined) {
			const date = new Date();
			const datestring = `${date.getFullYear()}-${date.getMonth() +
				1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}`;
			location = join(
				conf.capwatchFileDownloadDirectory,
				`CAPWATCH-${this.id}-${datestring}.zip`
			);
		}

		if (existsSync(location)) {
			await promisify(unlink)(location);
		}

		await this.streamCAPWATCHFile(id, createWriteStream(location));

		return location;
	}

	public async su(targetMember: MemberBase) {
		if (!this.isRioux) {
			throw new Error('Invalid permissions');
		}
	}

	public getReference = (): NHQMemberReference => ({
		type: 'CAPNHQMember',
		id: this.id
	});

	public toRaw(): NHQMemberObject {
		return {
			...super.toRaw(),
			type: 'CAPNHQMember',
			id: this.id,
			cookie: '',
			sessionID: this.sessionID
		};
	}

	public canManageBlog() {
		return (
			super.canManageBlog() ||
			this.hasDutyPosition([
				'Cadet Public Affairs Officer',
				'Cadet Public Affairs NCO',
				'Public Affairs officer'
			])
		);
	}
}
