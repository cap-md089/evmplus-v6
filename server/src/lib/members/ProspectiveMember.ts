import { Schema } from '@mysql/xdevapi';
import { createHmac, randomBytes } from 'crypto';
import { NextFunction, Response } from 'express';
import { sign } from 'jsonwebtoken';
import Account from '../Account';
import MemberBase from '../MemberBase';
import {
	collectResults,
	findAndBind,
	generateResults,
	modifyAndBind
} from '../MySQLUtil';
import { Member as NoPermissions } from '../Permissions';
import { MemberCreateError, MemberRequest } from './NHQMember';

const generateHash = (password: string, secret: string) =>
	createHmac('sha512', secret)
		.update(password)
		.digest()
		.toString('hex');

const hashPassword = (
	password: string,
	salt: string,
	revolutions = 2048
): string =>
	revolutions === 0
		? generateHash(password, salt)
		: hashPassword(generateHash(password, salt), salt, revolutions - 1);

interface MemberSession {
	id: string;
	expireTime: number;

	contact: MemberContact;
	memberRank: string;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
	seniorMember: boolean;
	squadron: string;
	orgid: number;
}

export default class ProspectiveMember extends MemberBase
	implements
		ProspectiveMemberAccount,
		Required<NoSQLDocument>,
		DatabaseInterface<ProspectiveMemberAccount> {
	public static async Create(
		newMember: MemberObject,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			ProspectiveMemberAccount
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
				prospect.prospectiveID.match(/([0-9])*/)[1],
				10
			);

			highestNumber = Math.max(numberPortion, highestNumber) + 1;
		}

		id += highestNumber;

		const salt = randomBytes(64).toString();

		const hashedPassword = hashPassword(password, salt);

		// tslint:disable-next-line:variable-name
		const _id = (await prospectiveCollection
			.add({
				...newMember,
				salt,
				password: hashedPassword,
				accountID: account.id,
				prospectiveID: id,
				kind: 'ProspectiveMember'
			})
			.execute()).getGeneratedIds()[0];

		return new ProspectiveMember(
			{
				_id,
				...newMember,
				salt,
				password: hashedPassword,
				accountID: account.id,
				prospectiveID: id,
				kind: 'ProspectiveMember'
			},
			account,
			schema,
			''
		);
	}

	public static async Signin(
		id: string,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			ProspectiveMemberAccount
		>(this.collectionName);

		const find = findAndBind(prospectiveCollection, {
			prospectiveID: id,
			accountID: account.id
		});

		const rows = await collectResults(find);

		if (rows.length !== 1) {
			throw new Error(MemberCreateError.UNKOWN_SERVER_ERROR.toString());
		}

		const { password: hash, salt } = rows[0];

		const hashedPassword = hashPassword(password, salt);

		// Failed login
		if (hash !== hashedPassword) {
			throw new Error(
				MemberCreateError.INCORRRECT_CREDENTIALS.toString()
			);
		}

		const member = await ProspectiveMember.Get(id, account, schema);
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
			req.member = await ProspectiveMember.Get(
				id,
				req.account,
				req.mysqlx
			);

			req.member.sessionID = id;
		}

		next();
	}

	public static async Get(
		id: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<
			ProspectiveMemberAccount & Required<NoSQLDocument>
		>(ProspectiveMember.collectionName);

		const find = findAndBind(prospectiveCollection, {
			prospectiveID: id,
			accountID: account.id
		});

		const rows = await collectResults(find);

		if (rows.length !== 1) {
			throw new Error(MemberCreateError.UNKOWN_SERVER_ERROR.toString());
		}

		return new ProspectiveMember(rows[0], account, schema, '');
	}

	public static Su(target: ProspectiveMember) {
		this.AddSession({
			expireTime: Date.now() / 1000 + 60 * 10,

			contact: target.contact,
			id: target.prospectiveID,
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

	public kind: 'ProspectiveMember' = 'ProspectiveMember';

	public prospectiveID: string;

	public password: '' = '';

	public salt: '' = '';

	public memberRank: string;

	public accountID: string;

	public sessionID: string = '';

	public flight: null | string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public permissions: MemberPermissions = NoPermissions;

	private constructor(
		member: ProspectiveMemberAccount & Required<NoSQLDocument>,
		account: Account,
		schema: Schema,
		sessionID: string
	) {
		super(member, schema, account);

		this.sessionID = sessionID;
	}

	public set(values: Partial<ProspectiveMemberAccount>) {
		const keys: Array<keyof ProspectiveMemberAccount> = [
			'contact',
			'flight'
		];

		for (const key of keys) {
			const i = key as keyof ProspectiveMemberAccount;
			const j = key as keyof ProspectiveMember;
			// isRioux is readonly, can't set to it...
			if (typeof this[j] === typeof values[i] && j !== 'isRioux') {
				this[j] = values[i];
			}
		}
	}

	public async save(): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<
			ProspectiveMemberAccount
		>(ProspectiveMember.collectionName);

		await prospectiveCollection.replaceOne(this._id, this.toRaw());
	}

	public toRaw = (): ProspectiveMemberAccount => ({
		accountID: this.requestingAccount.id,
		contact: this.contact,
		dutyPositions: [],
		id: 0,
		memberRank: this.memberRank,
		nameFirst: this.nameFirst,
		nameLast: this.nameLast,
		nameMiddle: this.nameMiddle,
		nameSuffix: this.nameSuffix,
		orgid: this.requestingAccount.mainOrg,
		password: '',
		prospectiveID: this.prospectiveID,
		salt: '',
		seniorMember: false,
		squadron: this.requestingAccount.getSquadronName(),
		usrID: this.usrID,
		kind: 'ProspectiveMember',
		permissions: this.permissions,
		flight: this.flight,
		teamIDs: this.teamIDs
	});

	public hasPermission = (
		permission: MemberPermission | MemberPermission[],
		threshold = 1
	) => false;

	public async updatePassword(password: string): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<
			ProspectiveMemberAccount
		>(ProspectiveMember.collectionName);

		const row = await collectResults(
			findAndBind(prospectiveCollection, {
				prospectiveID: this.prospectiveID,
				accountID: this.accountID
			})
		);

		if (row.length !== 0) {
			throw new Error('Invalid member count');
		}

		await modifyAndBind(prospectiveCollection, {
			accountID: this.accountID,
			prospectiveID: this.prospectiveID
		})
			.set('password', hashPassword(password, row[0].salt))
			.execute();
	}

	public getReference = (): ProspectiveMemberReference => ({
		kind: 'ProspectiveMember',
		id: this.prospectiveID
	});
}
