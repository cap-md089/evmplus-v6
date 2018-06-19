import Member from '../BaseMember';
import { 
	Identifiable,
	MemberContact,
	MemberAccessLevel,
	MemberPermissions,
	MemberObject,
	MemberCreateError
} from '../../types';
import { Member as MemberPermissionsLevel, getPermissions } from '../Permissions';

import { nhq as auth } from './pam/';
import { sign, verify } from 'jsonwebtoken';
import request from './pam/nhq-request';
import { load } from 'cheerio';

import { RequestHandler } from 'express';
import { MySQLRequest, prettySQL } from '../MySQLUtil';
import * as mysql from 'promise-mysql';

import Account, { AccountRequest } from '../Account';
import conf from '../../conf';
import { join } from 'path';
import { existsSync, unlinkSync, writeFile } from 'fs';

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
	/**
	 * Used to sign JWTs
	 */
	private static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	/**
	 * Stores the member sessions in memory as it is faster than a database
	 */
	protected static memberSessions: MemberSession[] = [];

	/**
	 * Permissions for the user
	 */
	public permissions: MemberPermissions = {
		FlightAssign: 0,
		MusterSheet: 0,
		PTSheet: 0,
		PromotionManagement: 0,
		AssignTasks: 0,
		AdministerPT: 0,
		DownloadStaffGuide: 0,
		AddEvent: 0,
		EditEvent: 0,
		EventContactSheet: 0,
		SignUpEdit: 0,
		CopyEvent: 0,
		ORMOPORD: 0,
		DeleteEvent: 0,
		AssignPosition: 0,
		EventStatusPage: 0,
		ProspectiveMemberManagment: 0,
		EventLinkList: 0,
		AddTeam: 0,
		EditTeam: 0,
		FileManagement: 0,
		PermissionManagement: 0,
		DownloadCAPWATCH: 0,
		RegistryEdit: 0
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

		let memberInfo = await Promise.all([
			auth.getName(cookie, username),
			auth.getContact(cookie),
		]);

		let id = memberInfo[0].capid;
		let sessionID;

		// Set session
		{
			let memberIndex = -1;

			for (let i in this.memberSessions) {
				if (NHQMember.memberSessions[i].id === id) {
					memberIndex = parseInt(i, 10);
				}
			}

			if (memberIndex === -1) {
				let sess: MemberSession = {
					expireTime: (Date.now() / 1000) + (60 * 10),

					id,
					memberRank: memberInfo[0].rank,
					cookieData: cookie,
					nameFirst: memberInfo[0].nameFirst,
					nameMiddle: memberInfo[0].nameMiddle,
					nameLast: memberInfo[0].nameLast,
					nameSuffix: memberInfo[0].nameSuffix,
					seniorMember: memberInfo[0].seniorMember,
					squadron: memberInfo[0].squadron,
					contact: memberInfo[1],
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

		let [
			pinfo,
			dutyPositions
		] = await Promise.all([
			NHQMember.GetPermissions(id, pool, account),
			NHQMember.GetDutypositions(id, pool, account)
		]);

		return new NHQMember(
			{
				id,
				memberRank: memberInfo[0].rank,
				nameFirst: memberInfo[0].nameFirst,
				nameMiddle: memberInfo[0].nameMiddle,
				nameLast: memberInfo[0].nameLast,
				nameSuffix: memberInfo[0].nameSuffix,
				seniorMember: memberInfo[0].seniorMember,
				squadron: memberInfo[0].squadron,
				contact: memberInfo[1],
				dutyPositions
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
					let sess = NHQMember.memberSessions.filter(s =>
						s.id === decoded.id);
					if (sess.length === 1) {
						let [
							pinfo,
							dutyPositions
						] = await Promise.all([
							NHQMember.GetPermissions(decoded.id, req.connectionPool, req.account),
							NHQMember.GetDutypositions(decoded.id, req.connectionPool, req.account)
						]);
						return new NHQMember(
							{
								id: sess[0].id,
								contact: sess[0].contact,
								dutyPositions,
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
		let rows: Array<{
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
		let retData: string[] = [];
		let data = await request('/cap.capwatch.web/splash.aspx', this.cookie, true);

		if (
			typeof data.headers.location !== 'undefined' &&
			data.headers.location === '/cap.capwatch.web/Modules/CapwatchRequest.aspx'
		) {
			throw new Error ('User needs permissions to access CAPWATCH');
		}

		data = await request('/cap.capwatch.web/Default.aspx', this.cookie);

		let $ = load (data.body);

		let select = $('#OrgChooser');

		// don't know what to do here. I don't know cheerio well

		return retData;
	}

	public async getCAPWATCHFile (id: number, location?: string) {
		if (location === undefined) {
			let date = new Date();
			let datestring = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getHours()}`;
			location = join(conf.path, 'capwatch-zips', `CAPWATCH-${datestring}.zip`);
		}

		let url = `https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?wa=true&unitOnly=0&ORGID=${id}`;

		let body = request(url, this.cookie);

		if (existsSync(location)) {
			unlinkSync(location);
		}

		writeFile(location, body, {}, err => {
			if (err) {
				console.log('Error in writing CAPWATCH file: ',  err);
			}
		});
	}
}