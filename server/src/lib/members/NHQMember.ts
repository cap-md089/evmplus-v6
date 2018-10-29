import { Schema } from '@mysql/xdevapi';
import { load } from 'cheerio';
import { RequestHandler } from 'express';
import { createWriteStream, existsSync, unlink } from 'fs';
import { request as httpRequest } from 'https';
import { sign, verify } from 'jsonwebtoken';
import { join } from 'path';
import { promisify } from 'util';
import conf from '../../conf';
import { MemberCAPWATCHErrors, MemberCreateError } from '../../enums';
import Account, { AccountRequest } from '../Account';
import { default as MemberBase } from '../MemberBase';
import { getPermissions } from '../Permissions';
import CAPWATCHMember from './CAPWATCHMember';
import { nhq as auth } from './pam';
import request from './pam/nhq-request';
import ProspectiveMember from './ProspectiveMember';

interface MemberSession extends Identifiable {
	id: number;
	expireTime: number;

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

export interface ConditionalMemberRequest extends AccountRequest {
	member: NHQMember | ProspectiveMember | null;
}

export interface MemberRequest extends AccountRequest {
	member: NHQMember | ProspectiveMember;
}

export default class NHQMember extends CAPWATCHMember
	implements CAPMemberObject {
	public static async Create(
		username: string | number,
		password: string,
		schema: Schema,
		account: Account
	): Promise<NHQMember> {
		let cookie;
		try {
			cookie = await auth.getCookies(username.toString(), password);
		} catch (e) {
			throw e;
		}

		const memberInfo = await Promise.all([
			auth.getName(cookie, username.toString()),
			auth.getContact(cookie)
		]);

		const id = memberInfo[0].capid;
		const [dutyPositions, extraInfo] = await Promise.all([
			NHQMember.GetRegularDutypositions(id, schema, account),
			NHQMember.LoadExtraMemberInformation(id, schema, account)
		]);
		let sessionID;

		// Set session
		{
			let memberIndex = -1;

			for (const i in this.memberSessions) {
				if (NHQMember.memberSessions[i].id === id) {
					memberIndex = parseInt(i, 10);
				}
			}

			if (memberIndex === -1) {
				const sess: MemberSession = {
					expireTime: Date.now() / 1000 + 60 * 10,

					contact: memberInfo[1],
					cookieData: cookie,
					id,
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
				NHQMember.memberSessions.push(sess);
			} else {
				NHQMember.memberSessions[memberIndex].expireTime =
					Date.now() / 1000 + 60 * 10;
			}

			sessionID = sign(
				{
					id
				},
				NHQMember.secret,
				{
					algorithm: 'HS512',
					expiresIn: '10min'
				}
			);
		}

		const permissions = getPermissions(extraInfo.accessLevel);

		return new NHQMember(
			{
				contact: memberInfo[1],
				dutyPositions: [
					...dutyPositions,
					...extraInfo.temporaryDutyPositions.map(v => v.Duty)
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
				cookie
			},
			schema,
			account,
			extraInfo
		);
	}

	public static ConditionalExpressMiddleware: RequestHandler = (
		req: MemberRequest,
		res,
		next
	) => {
		if (
			typeof req.headers !== 'undefined' &&
			typeof req.headers.authorization !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			let header: string = req.headers.authorization as string;
			if (typeof header !== 'string') {
				header = (header as string[])[0];
			}
			verify(
				header,
				NHQMember.secret,
				{
					algorithms: ['HS512']
				},
				async (
					err,
					decoded: {
						id: number | string;
					}
				) => {
					if (err) {
						req.member = null;
						next();
						return;
					}
					const id = decoded.id;

					if (typeof id === 'string') {
						ProspectiveMember.ExpressMiddleware(
							req,
							res,
							next,
							id,
							header
						);
						return;
					}

					NHQMember.memberSessions = NHQMember.memberSessions.filter(
						s => s.expireTime > Date.now() / 1000
					);
					const sess = NHQMember.memberSessions.filter(
						s => s.id === decoded.id
					);
					// const sess = await NHQMember.GetMemberSessions(decoded.id, req.mysqlx);
					if (sess.length === 1) {
						const [dutyPositions, extraInfo] = await Promise.all([
							NHQMember.GetRegularDutypositions(
								id,
								req.mysqlx,
								req.account
							),
							NHQMember.LoadExtraMemberInformation(
								id,
								req.mysqlx,
								req.account
							)
						]);

						const permissions = getPermissions(
							extraInfo.accessLevel
						);

						req.member = new NHQMember(
							{
								contact: sess[0].contact,
								dutyPositions: [
									...dutyPositions,
									...(extraInfo.temporaryDutyPositions.map(v => v.Duty))
								],
								id,
								memberRank: sess[0].memberRank,
								nameFirst: sess[0].nameFirst,
								nameLast: sess[0].nameLast,
								nameMiddle: sess[0].nameMiddle,
								nameSuffix: sess[0].nameSuffix,
								seniorMember: sess[0].seniorMember,
								squadron: sess[0].squadron,
								orgid: sess[0].orgid,
								usrID: NHQMember.GetUserID([
									sess[0].nameFirst,
									sess[0].nameMiddle,
									sess[0].nameLast,
									sess[0].nameSuffix
								]),
								type: 'CAPNHQMember',
								permissions,
								flight: sess[0].flight,
								teamIDs: extraInfo.teamIDs,
								sessionID: header,
								cookie: sess[0].cookieData
							},
							req.mysqlx,
							req.account,
							extraInfo
						);
						next();
						// 						if (req.member.accessLevel === 'Admin' && !req.member.isRioux) {

						// 						}
					} else {
						req.member = null;
						next();
					}
				}
			);
		} else {
			req.member = null;
			next();
		}
	};

	public static ExpressMiddleware: RequestHandler = (
		req: MemberRequest,
		res,
		next
	) => {
		NHQMember.ConditionalExpressMiddleware(req, res, () => {
			if (req.member === null) {
				res.status(401);
				res.end();
			} else {
				next();
			}
		});
	};

	/**
	 * Stores the member sessions in memory as it is faster than a database
	 */
	protected static memberSessions: MemberSession[] = [];

	/**
	 * Limit IDs to CAP IDs
	 */
	public id: number = 0;

	/**
	 * Permissions for the user
	 */
	public permissions: MemberPermissions = {
		AddEvent: 0,
		AddTeam: 0,
		AdministerPT: 0,
		AssignPosition: 0,
		AssignTasks: 0,
		CopyEvent: 0,
		DeleteEvent: 0,
		DownloadCAPWATCH: 0,
		DownloadStaffGuide: 0,
		EditEvent: 0,
		EditTeam: 0,
		EventContactSheet: 0,
		EventLinkList: 0,
		EventStatusPage: 0,
		FileManagement: 0,
		FlightAssign: 0,
		MusterSheet: 0,
		ORMOPORD: 0,
		PTSheet: 0,
		PermissionManagement: 0,
		PromotionManagement: 0,
		ProspectiveMemberManagment: 0,
		RegistryEdit: 0,
		SignUpEdit: 0
	};
	/**
	 * The access level which determines the permissions
	 */
	public accessLevel: MemberAccessLevel = 'Member';
	/**
	 * The ID to for the session of the member
	 */
	public sessionID: string = '';
	/**
	 * Used to differentiate between members
	 *
	 * The instanceof operator may work as well
	 */
	public type: CAPMemberType = 'CAPNHQMember';
	/**
	 * The cookie data used to access NHQ
	 */
	public cookie: string = '';

	protected extraInfo: ExtraMemberInformation;

	private constructor(
		data: NHQMemberObject,
		schema: Schema,
		account: Account,
		extraInfo: ExtraMemberInformation
	) {
		super(data, schema, account);
		this.accessLevel = extraInfo.accessLevel;
		this.sessionID = data.sessionID;
		this.extraInfo = extraInfo;

		if (this.isRioux) {
			this.permissions = getPermissions('Admin');
		} else {
			this.permissions = getPermissions(this.accessLevel);
		}
	}

	public async getCAPWATCHList(): Promise<string[]> {
		const retData: string[] = [];
		let data = await request(
			'/cap.capwatch.web/splash.aspx',
			this.cookie,
			true
		);

		if (
			typeof data.headers.location !== 'undefined' &&
			data.headers.location ===
				'/cap.capwatch.web/Modules/CapwatchRequest.aspx'
		) {
			throw new Error(
				MemberCAPWATCHErrors.INVALID_PERMISSIONS.toString()
			);
		}

		data = await request('/cap.capwatch.web/Default.aspx', this.cookie);

		const $ = load(data.body);

		const select = $('#OrgChooser');

		// don't know what to do here. I don't know cheerio well

		return retData;
	}

	public async streamCAPWATCHFile(id: number, stream: NodeJS.WritableStream) {
		const path = `/CAP.CapWatchAPI.Web/api/cw?wa=true&unitOnly=0&ORGID=${id}`;

		return new Promise<void>(resolve => {
			httpRequest(
				{
					hostname: 'www.capnhq.gov',
					protocol: 'https:',
					port: 443,
					path,
					method: 'GET',
					headers: {
						Accept:
							'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
						'Accept-Encoding': 'gzip, deflate, br',
						'Accept-Language': 'en-US,en;q=0.5',
						Connection: 'keep-alive',
						Cookie: this.cookie,
						Host: 'www.capnhq.gov',
						'Upgrade-Insecure-Requests': '1',
						'User-Agent': 'EventManagementLoginBot/2.0'
					}
				},
				res => {
					res.pipe(stream);
					res.on('end', () => {
						resolve();
					});
				}
			);
		});
	}

	public async getCAPWATCHFile(id: number, location?: string) {
		if (location === undefined) {
			const date = new Date();
			const datestring = `${date.getFullYear()}-${date.getMonth() +
				1}-${date.getHours()}`;
			location = join(
				conf.path,
				'capwatch-zips',
				`CAPWATCH-${datestring}.zip`
			);
		}

		if (existsSync(location)) {
			await promisify(unlink)(location);
		}

		await this.streamCAPWATCHFile(id, createWriteStream(location));
	}

	public hasPermission = (
		permission: MemberPermission | MemberPermission[],
		threshold = 1
	): boolean =>
		typeof permission === 'string'
			? this.permissions[permission] > threshold || this.isRioux
			: permission
					.map(p => this.hasPermission(p, threshold))
					.reduce((prev, curr) => prev || curr);

	public async su(
		targetMember: MemberBase | number | string
	): Promise<string> {
		let su =
			typeof targetMember === 'number' || typeof targetMember === 'string'
				? targetMember
				: targetMember.id;

		if (typeof su === 'string' && su.match(/([0-9]{6})/)) {
			su = parseInt(su, 10);
		}

		if (!this.isRioux) {
			throw new Error('Invalid permissions');
		}

		const sessionID = sign(
			{
				id: su
			},
			NHQMember.secret,
			{
				algorithm: 'HS512',
				expiresIn: '10min'
			}
		);

		let member;

		if (typeof su === 'number') {
			member = await CAPWATCHMember.Get(
				su,
				this.requestingAccount,
				this.schema
			);

			let memberIndex = 0;

			for (let i = 0; i < NHQMember.memberSessions.length; i++) {
				if (NHQMember.memberSessions[i].id === this.id) {
					memberIndex = i;
					break;
				}
			}

			NHQMember.memberSessions[memberIndex] = {
				contact: member.contact,
				cookieData: this.cookie,
				expireTime: Date.now() + 60 * 10,
				id: su,
				memberRank: member.memberRank,
				nameFirst: member.nameFirst,
				nameLast: member.nameLast,
				nameMiddle: member.nameMiddle,
				nameSuffix: member.nameSuffix,
				orgid: member.orgid,
				seniorMember: member.seniorMember,
				squadron: member.squadron,
				flight: member.flight
			};
		} else {
			member = await ProspectiveMember.GetProspective(
				su,
				this.requestingAccount,
				this.schema
			);

			ProspectiveMember.Su(member);
		}

		return sessionID;
	}

	public getReference = (): NHQMemberReference => ({
		type: 'CAPNHQMember',
		id: this.id
	});

	public toRaw = (): NHQMemberObject => ({
		...super.toRaw(),
		type: 'CAPNHQMember',
		id: this.id,
		cookie: '',
		sessionID: this.sessionID
	})
}
