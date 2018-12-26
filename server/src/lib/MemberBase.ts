import { Schema } from '@mysql/xdevapi';
import { NextFunction, Response } from 'express';
import { DateTime } from 'luxon';
import Account from './Account';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';

export default abstract class MemberBase implements MemberObject {
	public static GetMemberTypeFromID(inputID: string): MemberType {
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

		if (
			value.type === 'CAPProspectiveMember' &&
			typeof value.id === 'string'
		) {
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
				return ProspectiveMember.GetProspective(
					ref.id,
					account,
					schema
				);
		}
	}

	public static AreMemberReferencesTheSame(
		ref1: MemberReference,
		ref2: MemberReference
	) {
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

	/**
	 * Used to sign JWTs
	 */
	protected static secret: string =
		'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	protected static async LoadExtraMemberInformation(
		id: number,
		schema: Schema,
		account: Account
	): Promise<ExtraMemberInformation> {
		const extraMemberSchema = schema.getCollection<ExtraMemberInformation>(
			'ExtraMemberInformation'
		);
		const results = await collectResults(
			findAndBind(extraMemberSchema, {
				id,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accessLevel: 'Member',
				accountID: account.id,
				id,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: []
			};

			extraMemberSchema.add(newInformation).execute();

			return newInformation;
		}

		results[0].temporaryDutyPositions = results[0].temporaryDutyPositions.filter(
			v => v.validUntil > +DateTime.utc()
		);

		return results[0];
	}

	private static readonly useRiouxPermission = false;

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
			teamIDs: this.teamIDs
		};
	}

	public async *getTeams(): AsyncIterableIterator<Team> {
		const teamsCollection = this.schema.getCollection<TeamObject>('Teams');

		const reference = this.getReference();

		const teamFind = teamsCollection.find('true');

		const generator = generateResults(teamFind);

		for await (const i of generator) {
			let found =
				MemberBase.AreMemberReferencesTheSame(
					i.cadetLeader,
					reference
				) ||
				MemberBase.AreMemberReferencesTheSame(
					i.seniorCoach,
					reference
				) ||
				MemberBase.AreMemberReferencesTheSame(
					i.seniorMentor,
					reference
				);

			if (found === false) {
				for (const ref of i.members) {
					if (
						MemberBase.AreMemberReferencesTheSame(
							ref.reference,
							reference
						)
					) {
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
			? this.permissions[permission] > threshold
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
}

import Event from './Event';
import CAPWATCHMember from './members/CAPWATCHMember';
import { MemberRequest } from './members/NHQMember';
import ProspectiveMember from './members/ProspectiveMember';
import Team from './Team';

export { ConditionalMemberRequest, MemberRequest } from './members/NHQMember';
