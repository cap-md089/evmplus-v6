import { 
	Identifiable,
	MemberAccessLevel,
	MemberContact,
	MemberCreateError,
	MemberObject,
	MemberPermissions
} from '../../types';
import Member from '../BaseMember';
import { getPermissions, Member as MemberPermissionsLevel } from '../Permissions';

import { load } from 'cheerio';
import { sign, verify } from 'jsonwebtoken';
import { nhq as auth } from './pam/';
import request from './pam/nhq-request';

import { RequestHandler } from 'express';
import * as mysql from 'promise-mysql';
import { MySQLRequest, prettySQL } from '../MySQLUtil';

import { existsSync, unlinkSync, writeFile } from 'fs';
import { join } from 'path';
import conf from '../../conf';
import Account, { AccountRequest } from '../Account';

interface MemberSession extends Identifiable {
	id: number;
	expireTime: number;

	contact: MemberContact;
	memberRank: string;
	cookieData: string;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
	seniorMember: boolean;
	squadron: string;
}

export { MemberCreateError };

export interface MemberRequest extends MySQLRequest {
	member?: NHQMember;
}

export default class NHQMember extends Member {
	public static async Create (
		username: string,
		password: string,
		pool: mysql.Pool,
		account: Account
	): Promise<NHQMember> {
		let cookie;
		try {
			cookie = await auth.getCookies(username, password);
		} catch (e) {
			throw e;
		}

		const memberInfo = await Promise.all([
			auth.getName(cookie, username),
			auth.getContact(cookie),
		]);

		const id = memberInfo[0].capid;
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
					expireTime: (Date.now() / 1000) + (60 * 10),

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
				};
				NHQMember.memberSessions.push(sess);
			} else {
				NHQMember.memberSessions[memberIndex].expireTime =
					(Date.now()) / 1000 + (60 * 10);
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

		const [
			pinfo,
			dutyPositions
		] = await Promise.all([
			NHQMember.GetPermissions(id, pool, account),
			NHQMember.GetDutypositions(id, pool, account)
		]);

		return new NHQMember(
			{
				contact: memberInfo[1],
				dutyPositions,
				id,
				memberRank: memberInfo[0].rank,
				nameFirst: memberInfo[0].nameFirst,
				nameLast: memberInfo[0].nameLast,
				nameMiddle: memberInfo[0].nameMiddle,
				nameSuffix: memberInfo[0].nameSuffix,
				seniorMember: memberInfo[0].seniorMember,
				squadron: memberInfo[0].squadron
			},
			pinfo.permissions,
			pinfo.accessLevel,
			cookie,
			sessionID
		);
	}

	public static ExpressMiddleware: RequestHandler = (req: MemberRequest & AccountRequest, res, next) => {
		if (
			typeof req.headers !== 'undefined' &&
			typeof req.headers.authorization !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			let header = req.headers.authorization;
			if (typeof header !== 'string') {
				header = (header as string[])[0];
			}
			verify(
				header,
				NHQMember.secret,
				{
					algorithms: [
						'HS512'
					]
				},
				async (err, decoded: {
					id: number
				}) => {
					if (err) {
						req.member = null;
						next();
						return;
					}
					NHQMember.memberSessions = NHQMember.memberSessions.filter(s =>
						s.expireTime < (Date.now () / 1000));
					const sess = NHQMember.memberSessions.filter(s =>
						s.id === decoded.id);
					if (sess.length === 1) {
						const [
							pinfo,
							dutyPositions
						] = await Promise.all([
							NHQMember.GetPermissions(decoded.id, req.connectionPool, req.account),
							NHQMember.GetDutypositions(decoded.id, req.connectionPool, req.account)
						]);
						return new NHQMember(
							{
								contact: sess[0].contact,
								dutyPositions,
								id: sess[0].id,
								memberRank: sess[0].memberRank,
								nameFirst: sess[0].nameFirst,
								nameLast: sess[0].nameLast,
								nameMiddle: sess[0].nameMiddle,
								nameSuffix: sess[0].nameSuffix,
								seniorMember: sess[0].seniorMember,
								squadron: sess[0].squadron
							},
							pinfo.permissions,
							pinfo.accessLevel,
							sess[0].cookieData,
							header
						);
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
	}

	/**
	 * Stores the member sessions in memory as it is faster than a database
	 */
	protected static memberSessions: MemberSession[] = [];
	
	/**
	 * Used to sign JWTs
	 */
	private static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	private static GetDutypositions = async (capid: number, pool: mysql.Pool, account: Account): Promise<string[]> =>
		(await pool.query(
			`
				(
					SELECT
						Duty
					FROM
						Data_DutyPosition
					WHERE
						CAPID = ${capid}
					AND
						ORGID in (${account.orgIDs.join(', ')})
				)
					UNION
				(
					SELECT
						Duty
					FROM
						Data_CadetDutyPositions
					WHERE
						CAPID = ${capid}
					AND
						ORGID in (${account.orgIDs.join(', ')})
				)
					UNION
				(
					SELECT
						Duty
					FROM
						TemporaryDutyPositions
					WHERE
						capid = ${capid}
					AND
						AccountID = ${mysql.escape(account.id)}
				)
			`
		)).map((item: {Duty: string}) =>
			item.Duty)
	
	private static async GetPermissions (capid: number, pool: mysql.Pool, account: Account, su?: number): Promise<{
		accessLevel: MemberAccessLevel,
		permissions: MemberPermissions
	}> {
		const rows: Array<{
			AccessLevel: MemberAccessLevel,
		}> = await pool.query(
			prettySQL`
				SELECT
					AccessLevel
				FROM
					UserAccessLevels
				WHERE
					CAPID = ?
				AND
					(AccountID = ? OR AccountID = 'www')
			`,
			[
				NHQMember.IsRioux(capid) && typeof su !== 'undefined' ? su : capid,
				account.id
			]
		);

		if (
			rows.length === 1 ||
			NHQMember.IsRioux(capid)
		) {
			let accessLevel = rows[0].AccessLevel;
			if (NHQMember.IsRioux(capid)) {
				accessLevel = 'Admin';
			}
			return {
				accessLevel,
				permissions: getPermissions(accessLevel)
			};
		} else {
			return {
				accessLevel: 'Member',
				permissions: MemberPermissionsLevel
			};
		}
	}

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
	 * The cookie data used to access NHQ
	 */
	private cookie: string = '';

	

	private constructor (
		data: MemberObject,
		permissions: MemberPermissions,
		accessLevel: MemberAccessLevel,
		cookie: string,
		sessionID: string
	) {
		super(data);
		this.permissions = permissions;
		this.accessLevel = accessLevel;
		this.cookie = cookie;
		this.sessionID = sessionID; 
	}

	public async getCAPWATCHList (): Promise<string[]> {
		const retData: string[] = [];
		let data = await request('/cap.capwatch.web/splash.aspx', this.cookie, true);

		if (
			typeof data.headers.location !== 'undefined' &&
			data.headers.location === '/cap.capwatch.web/Modules/CapwatchRequest.aspx'
		) {
			throw new Error ('User needs permissions to access CAPWATCH');
		}

		data = await request('/cap.capwatch.web/Default.aspx', this.cookie);

		const $ = load (data.body);

		const select = $('#OrgChooser');

		// don't know what to do here. I don't know cheerio well

		return retData;
	}

	public async getCAPWATCHFile (id: number, location?: string) {
		if (location === undefined) {
			const date = new Date();
			const datestring = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getHours()}`;
			location = join(conf.path, 'capwatch-zips', `CAPWATCH-${datestring}.zip`);
		}

		const url = `https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?wa=true&unitOnly=0&ORGID=${id}`;

		const body = request(url, this.cookie);

		if (existsSync(location)) {
			unlinkSync(location);
		}

		writeFile(location, body, {}, err => {
			if (err) {
				// tslint:disable-next-line:no-console
				console.log('Error in writing CAPWATCH file: ',  err);
			}
		});
	}
}