import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	CAPMemberContact,
	ExtraMemberInformation,
	MemberObject,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	MemberType,
	RawTeamObject
} from 'common-lib';
import { NextFunction, Response } from 'express';
import { sign, verify, VerifyOptions } from 'jsonwebtoken';
import { DateTime } from 'luxon';
import { promisify } from 'util';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';

const promisedVerify = promisify(verify) as (
	token: string,
	key: string,
	options: VerifyOptions
) => Promise<object>;

const TEN_MINUTES = 10 * 60 * 1000;

export const SESSION_TIME = TEN_MINUTES;

export interface MemberSession {
	memberID: MemberReference;
	accountID: string;
	expireTime: number;
}

export default abstract class MemberBase implements MemberObject {
	public static readonly useRiouxPermission = true;

	public static GetMemberTypeFromID(inputID: string | number): MemberType {
		if (typeof inputID === 'number') {
			return 'CAPNHQMember';
		}

		if (inputID.match(/[a-z0-9]{1,15}-\d*/i)) {
			return 'CAPProspectiveMember';
		}
		if (inputID.match(/(([a-zA-Z]*)|(\d{6}))/i)) {
			return 'CAPNHQMember';
		}
	}

	public static IsRioux = (cm: MemberBase | number | string): boolean =>
		typeof cm === 'number' || typeof cm === 'string'
			? cm === 542488 || cm === 546319
			: cm.isRioux;

	public static GetUserID(name: string[]) {
		let usrID = '';

		usrID = name[2] + name[0][0] + name[1][0];

		return usrID.toLocaleLowerCase();
	}

	public static isReference(value: any): value is MemberReference {
		if (typeof value !== 'object') {
			return false;
		}

		if (value.type === 'undefined') {
			return false;
		}

		if (value.type === 'Null') {
			return true;
		}

		if (value.type === 'CAPNHQMember' && typeof value.id === 'number') {
			return true;
		}

		if (value.type === 'CAPProspectiveMember' && typeof value.id === 'string') {
			return true;
		}

		return false;
	}

	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull?: false
	): Promise<CAPWATCHMember | ProspectiveMember | null>;
	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull: true
	): Promise<CAPWATCHMember | ProspectiveMember>;

	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull = false
	): Promise<CAPWATCHMember | ProspectiveMember | null> {
		switch (ref.type) {
			case 'Null':
				if (errOnNull) {
					throw new Error('Null member');
				}
				return null;

			case 'CAPNHQMember':
				return CAPWATCHMember.Get(ref.id, account, schema);

			case 'CAPProspectiveMember':
				return ProspectiveMember.GetProspective(ref.id, account, schema);
		}
	}

	public static AreMemberReferencesTheSame(ref1: MemberReference, ref2: MemberReference) {
		if (ref1.type === 'Null' || ref2.type === 'Null') {
			return false;
		}

		return ref1.id === ref2.id;
	}

	public static BlogPermissionMiddleware(req: MemberRequest, res: Response, next: NextFunction) {
		if (!req.member) {
			res.status(401);
			res.end();
		}

		if (!req.member.canManageBlog()) {
			res.status(403);
			res.end();
		}

		next();
	}

	public static PermissionMiddleware = (permission: MemberPermission) => (
		req: MemberRequest,
		res: Response,
		next: NextFunction
	) => {
		if (!req.member) {
			res.status(401);
			res.end();
		}

		if (!req.member.hasPermission(permission)) {
			res.status(403);
			res.end();
		}

		next();
	};

	public static async ConditionalExpressMiddleware(
		req: ConditionalMemberRequest,
		res: Response,
		next: NextFunction
	) {
		if (
			typeof req.headers !== 'undefined' &&
			typeof req.headers.authorization !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			let header: string = req.headers.authorization as string;
			if (typeof header !== 'string') {
				header = (header as string[])[0];
			}

			let memRef: MemberReference;

			try {
				const decoded = (await promisedVerify(header, MemberBase.secret, {
					algorithms: ['HS512']
				})) as { id: MemberReference };

				memRef = decoded.id as MemberReference;
			} catch (e) {
				req.member = null;
				return next();
			}

			const sessInfo = await MemberBase.CheckSession(memRef, req.account, req.mysqlx);

			req.member = null;
			if (sessInfo === null) {
				return next();
			}

			switch (memRef.type) {
				case 'CAPNHQMember':
					// Doesn't work if you directly assign req.member to function
					// return value, but does work through proxy variable
					// Don't question it and everything works out fine
					const nhqmem = await NHQMember.LoadMemberFromSession(
						sessInfo.sess,
						req.account,
						req.mysqlx,
						sessInfo.newSessID
					);
					req.member = nhqmem;
					break;

				case 'CAPProspectiveMember':
					// Haven't tested no proxy variable, assumed similar to above
					const pmem = await ProspectiveMember.LoadMemberFromSession(
						sessInfo.sess,
						req.account,
						req.mysqlx
					);
					req.member = pmem;
					break;
			}

			if (req.member !== null) {
				req.newSessionID = sessInfo.newSessID;
			}

			res.header('x-new-sessionid', sessInfo.newSessID);

			return next();
		} else {
			return next();
		}
	}

	public static ExpressMiddleware(
		req: ConditionalMemberRequest,
		res: Response,
		next: NextFunction
	) {
		MemberBase.ConditionalExpressMiddleware(req, res, () => {
			if (req.member === null || req.member === undefined) {
				res.status(401);
				res.end();
			} else {
				next();
			}
		});
	}

	/**
	 * Used to sign JWTs
	 */
	protected static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	protected static async LoadExtraMemberInformation(
		memberID: MemberReference,
		schema: Schema,
		account: Account
	): Promise<ExtraMemberInformation> {
		if (memberID.type === 'Null') {
			throw new Error('Null member reference');
		}

		const extraMemberSchema = schema.getCollection<ExtraMemberInformation>(
			'ExtraMemberInformation'
		);

		const results = await collectResults(
			findAndBind(extraMemberSchema, {
				...memberID,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accessLevel: 'Member',
				accountID: account.id,
				...memberID,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: [],
				absentee: null
			};

			extraMemberSchema.add(newInformation).execute();

			return newInformation;
		}

		results[0].temporaryDutyPositions = results[0].temporaryDutyPositions.filter(
			v => v.validUntil > +DateTime.utc()
		);

		return results[0];
	}

	/**
	 * Adds a user session to the database
	 *
	 * @param info The session to add
	 */
	protected static async AddSession(
		info: MemberSession,
		account: Account,
		schema: Schema
	): Promise<string> {
		// BEGIN WHAT NEEDS TO BE REPLACED

		let memberIndex = -1;

		for (const i in this.Sessions) {
			if (MemberBase.AreMemberReferencesTheSame(info.memberID, this.Sessions[i].memberID)) {
				memberIndex = parseInt(i, 10);
			}
		}

		if (memberIndex === -1) {
			MemberBase.Sessions.push(info);
		} else {
			MemberBase.Sessions[memberIndex].expireTime = Date.now() + SESSION_TIME;
		}

		// END WHAT NEEDS TO BE REPLACED

		const sessionID = sign(
			{
				id: info.memberID
			},
			MemberBase.secret,
			{
				algorithm: 'HS512',
				expiresIn: '10min'
			}
		);

		return sessionID;
	}

	/**
	 * Checks the database to see if the member has a session
	 *
	 * @param ref The member reference to check for a session
	 */
	protected static async CheckSession(
		ref: MemberReference,
		account: Account,
		schema: Schema
	): Promise<{
		sess: MemberSession;
		newSessID: string;
	} | null> {
		// BEGIN WHAT NEEDS TO BE REPLACED
		MemberBase.Sessions = MemberBase.Sessions.filter(s => s.expireTime > Date.now());
		const sess = MemberBase.Sessions.filter(s =>
			MemberBase.AreMemberReferencesTheSame(s.memberID, ref)
		);
		// END WHAT SHOULD BE REPLACED

		if (sess.length !== 1) {
			return null;
		}

		// BEGIN WHAT NEEDS TO BE REPLACED
		sess[0].expireTime = Date.now() + SESSION_TIME;
		// END WHAT NEEDS TO BE REPLACED

		const newSessID = sign(
			{
				id: ref
			},
			MemberBase.secret,
			{
				algorithm: 'HS512',
				expiresIn: '10min'
			}
		);

		return {
			sess: sess[0],
			newSessID
		};
	}

	private static Sessions: MemberSession[] = [];

	/**
	 * CAPID
	 */
	public id: number | string;
	/**
	 * Contact information
	 */
	public contact: CAPMemberContact;
	/**
	 * Member squardon
	 */
	public squadron: string;
	/**
	 * The first name of the member
	 */
	public nameFirst: string;
	/**
	 * The middle name of the member
	 */
	public nameMiddle: string;
	/**
	 * The last name of the member
	 */
	public nameLast: string;
	/**
	 * The suffix of the user
	 */
	public nameSuffix: string;
	/**
	 * The User ID, usually can be used for logins
	 */
	public usrID: string;
	/**
	 * The IDs of teams the member is a part of
	 */
	public teamIDs: number[] = [];
	/**
	 * Shows how long the member is absent for
	 *
	 * Should not be used if null or if the time has passed
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;
	/**
	 * Checks for if a user has permissions
	 */
	public abstract permissions: MemberPermissions;
	/**
	 * Cheap way to produce references
	 */
	public abstract getReference: () => MemberReference;

	/**
	 * Used to differentiate when using polymorphism
	 *
	 * Another method is the instanceof operator, but to each their own
	 */
	public abstract type: MemberType;

	public constructor(
		data: MemberObject,
		protected schema: Schema,
		protected requestingAccount: Account
	) {
		Object.assign(this, data);

		this.isRioux = data.id === 542488 || data.id === 546319;
	}

	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.map(value => value.trimLeft().trimRight())
			.map(value => value.replace(/\r\n/gm, ''))
			.map(value => value.replace(/(  +)/g, ' '))
			.map((value, i) => (i === 1 ? value.charAt(0) : value))
			.join(' ');

	public toRaw(): MemberObject {
		return {
			id: this.id,
			contact: this.contact,
			nameFirst: this.nameFirst,
			nameLast: this.nameLast,
			nameMiddle: this.nameMiddle,
			nameSuffix: this.nameSuffix,
			usrID: this.usrID,
			type: this.type,
			permissions: this.permissions,
			teamIDs: this.teamIDs,
			absenteeInformation: this.absenteeInformation
		};
	}

	public async *getTeams(): AsyncIterableIterator<Team> {
		const teamsCollection = this.schema.getCollection<RawTeamObject>('Teams');

		const reference = this.getReference();

		const teamFind = teamsCollection.find('true');

		const generator = generateResults(teamFind);

		for await (const i of generator) {
			let found =
				MemberBase.AreMemberReferencesTheSame(i.cadetLeader, reference) ||
				MemberBase.AreMemberReferencesTheSame(i.seniorCoach, reference) ||
				MemberBase.AreMemberReferencesTheSame(i.seniorMentor, reference);

			if (found === false) {
				for (const ref of i.members) {
					if (MemberBase.AreMemberReferencesTheSame(ref.reference, reference)) {
						found = true;
						break;
					}
				}
			}
			if (found) {
				yield Team.Get(i.id, this.requestingAccount, this.schema);
			}
		}
	}

	public matchesReference(ref: MemberReference): boolean {
		return ref.type === this.type && ref.id === this.id;
	}

	public hasPermission(
		permission: MemberPermission | MemberPermission[],
		threshold = 1
	): boolean {
		return this.isRioux && MemberBase.useRiouxPermission
			? true
			: typeof permission === 'string'
			? this.permissions[permission] >= threshold
			: permission
					.map(p => this.hasPermission(p, threshold))
					.reduce((prev, curr) => prev || curr);
	}

	public getFullName() {
		return this.getName();
	}

	public canManageBlog() {
		return this.isRioux || this.hasPermission('ManageBlog');
	}

	public isPOCOf(event: Event) {
		return event.isPOC(this);
	}

	public async getNotificationCount() {
		return 0;
	}
}

import Account from './Account';
import Event from './Event';
import CAPWATCHMember from './members/CAPWATCHMember';
import NHQMember, { ConditionalMemberRequest, MemberRequest } from './members/NHQMember';
import ProspectiveMember from './members/ProspectiveMember';
import Team from './Team';
export { ConditionalMemberRequest, MemberRequest } from './members/NHQMember';