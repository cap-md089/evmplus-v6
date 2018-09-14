import { Schema } from '@mysql/xdevapi';
import { load } from 'cheerio';
import { RequestHandler } from 'express';
import { existsSync, unlink, writeFile } from 'fs';
import { sign, verify } from 'jsonwebtoken';
import { join } from 'path';
import { promisify } from 'util';
import conf from '../../conf';
import { MemberCAPWATCHErrors, MemberCreateError } from '../../enums';
import Account, { AccountRequest } from '../Account';
import Member from '../MemberBase';
import { getPermissions } from '../Permissions';
import { nhq as auth } from './pam';
import request from './pam/nhq-request';

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
	orgid: number;
}

export { MemberCreateError };

export interface MemberRequest extends AccountRequest {
	member: NHQMember | null;
}

export default class NHQMember extends Member {
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
					orgid: memberInfo[0].orgid
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

		const [dutyPositions, extraInfo] = await Promise.all([
			NHQMember.GetRegularDutypositions(id, schema, account),
			NHQMember.LoadExtraMemberInformation(id, schema, account)
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
				squadron: memberInfo[0].squadron,
				orgid: memberInfo[0].orgid
			},
			cookie,
			sessionID,
			schema,
			account,
			extraInfo
		);
	}

	public static ExpressMiddleware: RequestHandler = (
		req: MemberRequest & AccountRequest,
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
						id: number;
					}
				) => {
					if (err) {
						req.member = null;
						next();
						return;
					}
					NHQMember.memberSessions = NHQMember.memberSessions.filter(
						s => s.expireTime > Date.now() / 1000
					);
					const sess = NHQMember.memberSessions.filter(
						s => s.id === decoded.id
					);
					if (sess.length === 1) {
						const [dutyPositions, extraInfo] = await Promise.all([
							NHQMember.GetRegularDutypositions(
								decoded.id,
								req.mysqlx,
								req.account
							),
							NHQMember.LoadExtraMemberInformation(
								decoded.id,
								req.mysqlx,
								req.account
							)
						]);
						req.member = new NHQMember(
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
								squadron: sess[0].squadron,
								orgid: sess[0].orgid
							},
							sess[0].cookieData,
							header,
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

	/**
	 * Stores the member sessions in memory as it is faster than a database
	 */
	protected static memberSessions: MemberSession[] = [];

	/**
	 * Used to sign JWTs
	 */
	private static secret: string =
		'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

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

	protected extraInfo: ExtraMemberInformation;

	/**
	 * The cookie data used to access NHQ
	 */
	private cookie: string = '';

	private constructor(
		data: MemberObject,
		cookie: string,
		sessionID: string,
		schema: Schema,
		account: Account,
		extraInfo: ExtraMemberInformation
	) {
		super(data, schema, account);
		this.accessLevel = extraInfo.accessLevel;
		this.cookie = cookie;
		this.sessionID = sessionID;
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

		const url = `https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?wa=true&unitOnly=0&ORGID=${id}`;

		const body = await request(url, this.cookie);

		if (existsSync(location)) {
			await promisify(unlink)(location);
		}

		writeFile(location, body, {}, err => {
			if (err) {
				// tslint:disable-next-line:no-console
				console.log('Error in writing CAPWATCH file: ', err);
			}
		});
	}
}
