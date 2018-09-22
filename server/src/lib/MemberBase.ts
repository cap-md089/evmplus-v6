import { Schema } from '@mysql/xdevapi';
import Account from './Account';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';

export default abstract class MemberBase implements MemberObject {
	public static IsRioux = (cm: MemberBase | number | string): boolean =>
		typeof cm === 'string' ? false : typeof cm === 'number' ? cm === 542488 || cm === 546319 : cm.isRioux;

	public static GetUserID(name: string[]) {
		let usrID = '';

		usrID = name[2] + name[0] + name[1];

		return usrID;
	}

	/**
	 * Used to sign JWTs
	 */
	protected static secret: string =
		'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	protected static GetRegularDutypositions = async (
		capid: number,
		schema: Schema,
		account: Account
	): Promise<string[]> =>
		(await Promise.all([
			collectResults(
				schema
					.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition')
					.find('CAPID = :CAPID')
					.bind('CAPID', capid)
			),
			collectResults(
				schema
					.getCollection<NHQ.CadetDutyPosition>(
						'NHQ_CadetDutyPosition'
					)
					.find('CAPID = :CAPID')
					.bind('CAPID', capid)
			)
		]))
			.reduce((prev, curr) => [...prev, ...curr])
			.map(item => item.Duty);

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
				temporaryDutyPositions: []
			};

			extraMemberSchema.add(newInformation).execute();

			return newInformation;
		}

		return results[0];
	}

	/**
	 * CAPID
	 */
	public id: number = 0;
	/**
	 * The rank of the member
	 */
	public memberRank: string = '';
	/**
	 * Whether or not the member is a senior member
	 */
	public seniorMember: boolean = false;
	/**
	 * The member name + the member rank
	 */
	public memberRankName: string = '';
	/**
	 * Contact information
	 */
	public contact: MemberContact = {
		ALPHAPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ASSISTANT: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTEMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CELLPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		DIGITALPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		EMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		INSTANTMESSAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ISDN: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		RADIO: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		TELEX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' }
	};
	/**
	 * Duty positions
	 */
	public dutyPositions: string[] = [];
	/**
	 * Member squardon
	 */
	public squadron: string = '';
	/**
	 * The first name of the member
	 */
	public nameFirst: string = '';
	/**
	 * The middle name of the member
	 */
	public nameMiddle: string = '';
	/**
	 * The last name of the member
	 */
	public nameLast: string = '';
	/**
	 * The suffix of the user
	 */
	public nameSuffix: string = '';
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number = 0;
	/**
	 * The User ID, usually can be used for logins
	 */
	public usrID: string;
	/**
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;

	/**
	 * Used to differentiate when using polymorphism
	 * 
	 * Another method is the instanceof operator, but to each their own
	 * That method would probably work better however
	 */
	public abstract kind: MemberType;

	public constructor(
		data: MemberObject,
		protected schema: Schema,
		protected requestingAccount: Account
	) {
		Object.assign(this, data);

		this.memberRankName = `${this.memberRank} ${this.getName()}`;

		this.isRioux = data.id === 542488 || data.id === 546319;
	}

	public hasDutyPosition = (dutyPosition: string | string[]): boolean =>
		typeof dutyPosition === 'string'
			? this.dutyPositions.indexOf(dutyPosition) > -1
			: dutyPosition
					.map(this.hasDutyPosition)
					.reduce((a, b) => a || b, false);

	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.join(' ');

	public toRaw = (): MemberObject => ({
		id: this.id,
		contact: this.contact,
		dutyPositions: this.dutyPositions,
		memberRank: this.memberRank,
		nameFirst: this.nameFirst,
		nameLast: this.nameLast,
		nameMiddle: this.nameMiddle,
		nameSuffix: this.nameSuffix,
		seniorMember: this.seniorMember,
		squadron: this.squadron,
		orgid: this.orgid,
		usrID: this.usrID,
		kind: this.kind
	});

	public async *getAccounts(): AsyncIterableIterator<Account> {
		const accountsCollection = this.schema.getCollection<AccountObject>('Accounts');

		const accountFind = accountsCollection.find(':orgIDs in orgIDs').bind({
			orgIDs: [this.orgid]
		});

		const generator = generateResults(accountFind);

		for await (const i of generator) {
			yield Account.Get(i.id, this.schema);
		}
	}
}

export { default as NHQMember, MemberRequest, ConditionalMemberRequest } from './members/NHQMember';
export { default as CAPWATCHMember } from './members/CAPWATCHMember';
export { default as ProspectiveMember } from './members/ProspectiveMember';