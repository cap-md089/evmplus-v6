import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	CAPMemberContact,
	DatabaseInterface,
	ExtraMemberInformation,
	MemberPermissions,
	NoSQLDocument,
	ProspectiveMemberObject,
	ProspectiveMemberReference,
	RawProspectiveMemberObject
} from 'common-lib';
import { createHmac, randomBytes } from 'crypto';
import Account from '../Account';
import { MemberSession, SESSION_TIME } from '../MemberBase';
import { collectResults, findAndBind, generateResults, modifyAndBind } from '../MySQLUtil';
import { Member as NoPermissions } from '../Permissions';
import CAPWATCHMember from './CAPWATCHMember';
import { MemberCreateError } from './NHQMember';

interface ProspectiveMemberSession extends MemberSession {
	memberID: ProspectiveMemberReference;

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

export const generateHash = (password: string, secret: string) =>
	createHmac('sha512', secret)
		.update(password)
		.digest()
		.toString('hex');

export const hashPassword = (password: string, salt: string, revolutions = 65536): string =>
	revolutions === 0
		? generateHash(password, salt)
		: hashPassword(generateHash(password, salt), salt, revolutions - 1);

export default class ProspectiveMember extends CAPWATCHMember
	implements
		ProspectiveMemberObject,
		Required<NoSQLDocument>,
		DatabaseInterface<ProspectiveMemberObject> {
	public static async Create(
		newMember: RawProspectiveMemberObject,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		const prospectiveCollection = schema.getCollection<RawProspectiveMemberObject>(
			this.collectionName
		);

		let id: string = `${account.id}-`;
		let highestNumber: number = 0;

		const iterator = generateResults(
			findAndBind(prospectiveCollection, {
				accountID: account.id
			})
		);

		for await (const prospect of iterator) {
			const match = (prospect.id.match(/([0-9])*$/) || [])[1];
			const numberPortion = parseInt(match, 10);

			highestNumber = Math.max(numberPortion, highestNumber);
		}

		id += highestNumber + 1;

		const salt = randomBytes(128).toString();

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

		const extraInformation = await ProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new ProspectiveMember(
			{
				_id,
				...newMember,
				id,
				salt,
				password: hashedPassword,
				accountID: account.id,
				type: 'CAPProspectiveMember',
				squadron: account.getSquadronName(),
				absenteeInformation: null
			},
			account,
			schema,
			'',
			account,
			extraInformation
		);
	}

	public static async Signin(
		id: string,
		password: string,
		account: Account,
		schema: Schema
	): Promise<ProspectiveMember> {
		id = id.toLocaleLowerCase();

		const prospectiveCollection = schema.getCollection<RawProspectiveMemberObject>(
			this.collectionName
		);

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
			throw new Error(MemberCreateError.INCORRRECT_CREDENTIALS.toString());
		}

		const member = await ProspectiveMember.GetProspective(id, account, schema);

		const sess: ProspectiveMemberSession = {
			accountID: account.id,
			expireTime: Date.now() + SESSION_TIME,
			memberID: {
				type: 'CAPProspectiveMember',
				id
			},

			contact: member.contact,
			memberRank: member.memberRank,
			nameFirst: member.nameFirst,
			nameLast: member.nameLast,
			nameMiddle: member.nameMiddle,
			nameSuffix: member.nameSuffix,
			seniorMember: member.seniorMember,
			squadron: member.squadron,
			orgid: member.orgid
		};

		const sessionID = await ProspectiveMember.AddSession(sess, account, schema);

		member.sessionID = sessionID;

		return member;
	}

	public static async LoadMemberFromSession(
		session: MemberSession,
		account: Account,
		schema: Schema
	) {
		const ref = session.memberID as ProspectiveMemberReference;

		try {
			const member = await ProspectiveMember.GetProspective(ref.id, account, schema);

			return member;
		} catch (e) {
			return null;
		}
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

		const extraInformation = await ProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new ProspectiveMember(
			{
				...rows[0],
				dutyPositions: [],
				absenteeInformation: extraInformation.absentee
			},
			account,
			schema,
			'',
			homeAccount,
			extraInformation
		);
	}

	private static collectionName = 'ProspectiveMembers';

	public id: string;

	public type: 'CAPProspectiveMember' = 'CAPProspectiveMember';

	public password: '' = '';

	public salt: '' = '';

	public memberRank: string;

	public accountID: string;

	public sessionID: string;

	public flight: null | string;

	public absenteeInformation: AbsenteeInformation | null;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public permissions: MemberPermissions = NoPermissions;

	private constructor(
		member: ProspectiveMemberObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema,
		sessionID: string,
		protected homeAccount: Account,
		extraInformation: ExtraMemberInformation
	) {
		super(member, schema, account, extraInformation);

		this.id = member.id;
		this._id = member._id;
		this.memberRank = member.memberRank;
		this.flight = member.flight;
		this.absenteeInformation = extraInformation.absentee;

		this.accountID = member.accountID;
		this.sessionID = sessionID;
	}

	public set(values: Partial<ProspectiveMemberObject>) {
		const keys: Array<keyof ProspectiveMemberObject> = ['contact', 'flight'];

		for (const key of keys) {
			const i = key as keyof ProspectiveMemberObject;
			const j = key as keyof ProspectiveMember;
			// isRioux is readonly, can't set to it...
			if (typeof this[j] === typeof values[i] && j !== 'isRioux') {
				// @ts-ignore
				this[j] = values[i];
			}
		}

		return true;
	}

	public async save(): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<RawProspectiveMemberObject>(
			ProspectiveMember.collectionName
		);

		await prospectiveCollection.replaceOne(this._id, this.toRaw());
	}

	public toRaw(): ProspectiveMemberObject {
		return {
			...super.toRaw(),
			accountID: this.accountID,
			id: this.id,
			password: '',
			salt: '',
			squadron: this.requestingAccount.getSquadronName(),
			type: 'CAPProspectiveMember'
		};
	}

	public async updatePassword(password: string): Promise<void> {
		const prospectiveCollection = this.schema.getCollection<RawProspectiveMemberObject>(
			ProspectiveMember.collectionName
		);

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
