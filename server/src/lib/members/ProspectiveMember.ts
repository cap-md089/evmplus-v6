import { Schema } from '@mysql/xdevapi';
import { createHmac, randomBytes } from 'crypto';
import { NextFunction, Response } from 'express';
import { sign } from 'jsonwebtoken';
import Account from '../Account';
import {
	collectResults,
	findAndBind,
	generateResults,
	modifyAndBind
} from '../MySQLUtil';
import { Member as NoPermissions } from '../Permissions';
import CAPWATCHMember from './CAPWATCHMember';
import { MemberCreateError, MemberRequest } from './NHQMember';

export const generateHash = (password: string, secret: string) =>
	createHmac('sha512', secret)
		.update(password)
		.digest()
		.toString('hex');

export const hashPassword = (
	password: string,
	salt: string,
	revolutions = 1024
): string =>
	revolutions === 0
		? generateHash(password, salt)
		: hashPassword(generateHash(password, salt), salt, revolutions - 1);

interface MemberSession {
	id: string;
	expireTime: number;

	contact: CAPMemberContact;
	memberRank: string;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
	seniorMember: boolean;
	squadron: string;
	orgid: number;
}

export default class ProspectiveMember extends CAPWATCHMember
	implements
		ProspectiveMemberObject,
		Required<NoSQLDocument>,
		DatabaseInterface<ProspectiveMemberObject> {
	public static async Create(
		newMember: ProspectiveMemberObject,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			RawProspectiveMemberObject
		>(this.collectionName);

		let id: string = `${account.getSquadronName()}-`;
		let highestNumber: number = 0;

		const iterator = generateResults(
			findAndBind(prospectiveCollection, {
				accountID: account.id
			})
		);

		for await (const prospect of iterator) {
			const numberPortion = parseInt(
				prospect.id.match(/([0-9])*/)[1],
				10
			);

			highestNumber = Math.max(numberPortion, highestNumber);
		}

		id += (highestNumber + 1);

		const salt = randomBytes(64).toString();

		const hashedPassword = hashPassword(password, salt);

		// tslint:disable-next-line:variable-name
		const _id = (await prospectiveCollection
			.add({
				...newMember,
				salt,
				password: hashedPassword,
				id,
				accountID: account.id,
				type: 'CAPProspectiveMember'
			})
			.execute()).getGeneratedIds()[0];

		return new ProspectiveMember(
			{
				_id,
				...newMember,
				id,
				salt,
				password: hashedPassword,
				accountID: account.id,
				type: 'CAPProspectiveMember',
				squadron: account.getSquadronName()
			},
			account,
			schema,
			'',
			account
		);
	}

	public static async Signin(
		id: string,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			RawProspectiveMemberObject
		>(this.collectionName);

		const find = findAndBind(prospectiveCollection, {
			id,
			accountID: account.id
		});

		const rows = await collectResults(find);

		if (rows.length !== 1) {
			throw new Error(MemberCreateError.INCORRRECT_CREDENTIALS.toString());
		}

		const { password: hash, salt } = rows[0];

		const hashedPassword = hashPassword(password, salt);

		// Failed login
		if (hash !== hashedPassword) {
			throw new Error(
				MemberCreateError.INCORRRECT_CREDENTIALS.toString()
			);
		}

		const member = await ProspectiveMember.GetProspective(
			id,
			account,
			schema
		);

		let sessionID;
		{
			let memberIndex = -1;
			const memberSessions = this.GetSessions();

			for (const i in memberSessions) {
				if (memberSessions[i].id === id) {
					memberIndex = parseInt(i, 10);
				}
			}

			if (memberIndex === -1) {
				const sess: MemberSession = {
					expireTime: Date.now() / 1000 + 60 * 10,

					contact: member.contact,
					id,
					memberRank: member.memberRank,
					nameFirst: member.nameFirst,
					nameLast: member.nameLast,
					nameMiddle: member.nameMiddle,
					nameSuffix: member.nameSuffix,
					seniorMember: member.seniorMember,
					squadron: member.squadron,
					orgid: member.orgid
				};
				this.AddSession(sess);
			} else {
				this.ResetSession(memberIndex);
			}

			sessionID = sign(
				{
					id
				},
				this.secret,
				{
					algorithm: 'HS512',
					expiresIn: '10min'
				}
			);
		}

		member.sessionID = sessionID;

		return member;
	}

	public static async ExpressMiddleware(
		req: MemberRequest,
		res: Response,
		next: NextFunction,
		id: string,
		sessionID: string
	) {
		const sessions = this.GetSessions().filter(sess => sess.id === id);

		if (sessions.length === 1) {
			req.member = await ProspectiveMember.GetProspective(
				id,
				req.account,
				req.mysqlx
			);

			req.member.sessionID = id;
		}

		next();
	}

	public static async GetProspective(
		id: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			RawProspectiveMemberObject & Required<NoSQLDocument>
		>(ProspectiveMember.collectionName);

		const find = findAndBind(prospectiveCollection, {
			id,
			accountID: account.id
		});

		const rows = await collectResults(find);

		if (rows.length !== 1) {
			throw new Error(MemberCreateError.UNKOWN_SERVER_ERROR.toString());
		}

		const homeAccount = await Account.Get(rows[0].accountID, schema);

		return new ProspectiveMember(
			{
				...rows[0],
				dutyPositions: []
			},
			account,
			schema,
			'',
			homeAccount
		);
	}

	public static Su(target: ProspectiveMember) {
		this.AddSession({
			expireTime: Date.now() / 1000 + 60 * 10,

			contact: target.contact,
			id: target.id,
			memberRank: target.memberRank,
			nameFirst: target.nameFirst,
			nameLast: target.nameLast,
			nameMiddle: target.nameMiddle,
			nameSuffix: target.nameSuffix,
			seniorMember: target.seniorMember,
			squadron: target.squadron,
			orgid: target.orgid
		});
	}

	protected static MemberSessions: MemberSession[] = [];

	protected static AddSession = (sess: MemberSession) =>
		ProspectiveMember.MemberSessions.push(sess);

	protected static GetSessions = () =>
		(ProspectiveMember.MemberSessions = ProspectiveMember.MemberSessions.filter(
			v => v.expireTime > Date.now() / 1000
		));

	protected static ResetSession = (index: number) => {
		ProspectiveMember.MemberSessions[index].expireTime =
			Date.now() / 1000 + 10 * 60;
	};

	private static collectionName = 'ProspectiveMembers';

	public id: string;

	public type: 'CAPProspectiveMember' = 'CAPProspectiveMember';

	public password: '' = '';

	public salt: '' = '';

	public memberRank: string;

	public accountID: string;

	public sessionID: string;

	public flight: null | string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public permissions: MemberPermissions = NoPermissions;

	private constructor(
		member: ProspectiveMemberObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema,
		sessionID: string,
		protected homeAccount: Account
	) {
		super(member, schema, account);

		this.accountID = member.accountID;
		this.sessionID = sessionID;
	}

	public set(values: Partial<ProspectiveMemberObject>) {
		const keys: Array<keyof ProspectiveMemberObject> = [
			'contact',
			'flight'
		];

		for (const key of keys) {
			const i = key as keyof ProspectiveMemberObject;
			const j = key as keyof ProspectiveMember;
			// isRioux is readonly, can't set to it...
			if (typeof this[j] === typeof values[i] && j !== 'isRioux') {
				this[j] = values[i];
			}
		}
	}

	public async save(): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<
			RawProspectiveMemberObject
		>(ProspectiveMember.collectionName);

		await prospectiveCollection.replaceOne(this._id, this.toRaw());
	}

	public toRaw (): ProspectiveMemberObject {
		return ({
			...super.toRaw(),
			accountID: this.accountID,
			id: this.id,
			password: '',
			salt: '',
			squadron: this.requestingAccount.getSquadronName(),
			type: 'CAPProspectiveMember'
		});
	}

	public async updatePassword(password: string): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<
			RawProspectiveMemberObject
		>(ProspectiveMember.collectionName);

		const row = await collectResults(
			findAndBind(prospectiveCollection, {
				id: this.id,
				accountID: this.accountID
			})
		);

		if (row.length !== 0) {
			throw new Error('Invalid member count');
		}

		await modifyAndBind(prospectiveCollection, {
			accountID: this.accountID,
			id: this.id
		})
			.set('password', hashPassword(password, row[0].salt))
			.execute();
	}

	public getReference = (): ProspectiveMemberReference => ({
		type: 'CAPProspectiveMember',
		id: this.id
	});
}
