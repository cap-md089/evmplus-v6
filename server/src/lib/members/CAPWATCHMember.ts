import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import Account from '../Account';
import MemberBase from '../MemberBase';
import { collectResults, findAndBind, generateResults } from '../MySQLUtil';
import { getPermissions } from '../Permissions';

export default class CAPWATCHMember extends MemberBase implements CAPMemberObject {
	public static readonly tableNames = {
		member: 'NHQ_Member',
		contact: 'NHQ_MbrContact'
	};

	public static async Get(
		id: number,
		account: Account,
		schema: Schema
	): Promise<CAPWATCHMember> {
		const memberTable = schema.getCollection<NHQ.Member>(
			this.tableNames.member
		);
		const memberContactTable = schema.getCollection<NHQ.MbrContact>(
			this.tableNames.contact
		);

		const [
			results,
			capwatchContact,
			dutyPositions,
			extraInformation
		] = await Promise.all([
			collectResults(
				findAndBind(memberTable, {
					CAPID: id
				})
			),
			collectResults(
				findAndBind(memberContactTable, {
					CAPID: id
				})
			),
			CAPWATCHMember.GetRegularDutypositions(id, schema, account),
			CAPWATCHMember.LoadExtraMemberInformation(id, schema, account)
		]);

		if (results.length !== 1) {
			throw new Error('Cannot select member');
		}

		const memberContact: { [key: string]: Partial<{}> } = {
			ALPHAPAGER: {},
			ASSISTANT: {},
			CADETPARENTEMAIL: {},
			CADETPARENTPHONE: {},
			CELLPHONE: {},
			DIGITALPAGER: {},
			EMAIL: {},
			HOMEFAX: {},
			HOMEPHONE: {},
			INSTANTMESSAGER: {},
			ISDN: {},
			RADIO: {},
			TELEX: {},
			WORKFAX: {},
			WORKPHONE: {}
		};

		for (const i in memberContact) {
			if (memberContact.hasOwnProperty(i)) {
				memberContact[i] = {
					PRIMARY: '',
					SECONDARY: '',
					EMERGENCY: ''
				};
			}
		}

		const contact = (memberContact as any) as CAPMemberContact;

		capwatchContact.forEach(val => {
			contact[
				val.Type.toUpperCase().replace(/ /g, '') as CAPMemberContactType
			][val.Priority] = val.Contact;
		});

		const temporaryDutyPositions = extraInformation.temporaryDutyPositions
			.filter(val => val.validUntil > +DateTime.utc())
			.map(val => val.Duty);

		const permissions = getPermissions(extraInformation.accessLevel);

		return new CAPWATCHMember(
			{
				id,
				contact,
				dutyPositions: [...dutyPositions, ...temporaryDutyPositions],
				memberRank: results[0].Rank,
				nameFirst: results[0].NameFirst,
				nameLast: results[0].NameLast,
				nameMiddle: results[0].NameMiddle,
				nameSuffix: results[0].NameSuffix,
				seniorMember: results[0].Type !== 'CADET',
				squadron: `${results[0].Region}-${results[0].Wing}-${
					results[0].Unit
				}`,
				orgid: results[0].ORGID,
				usrID: CAPWATCHMember.GetUserID([
					results[0].NameFirst,
					results[0].NameMiddle,
					results[0].NameLast,
					results[0].NameSuffix
				]),
				type: 'CAPNHQMember',
				permissions,
				teamIDs: extraInformation.teamIDs,
				flight: extraInformation.flight
			},
			schema,
			account
		);
	}

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

	public permissions: MemberPermissions;

	public type: CAPMemberType = 'CAPNHQMember';

	public id: number | string;
	/**
	 * The rank of the member
	 */
	public memberRank: string;
	/**
	 * Whether or not the member is a senior member
	 */
	public seniorMember: boolean;
	/**
	 * The member name + the member rank
	 */
	public memberRankName: string;
	/**
	 * Duty positions
	 */
	public dutyPositions: string[];
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: null | string;

	protected constructor(
		data: CAPMemberObject,
		schema: Schema,
		requestingAccount: Account
	) {
		super(data, schema, requestingAccount);

		this.memberRank = data.memberRank;
		this.seniorMember = data.seniorMember;
		this.dutyPositions = data.dutyPositions;
		this.orgid = data.orgid;
		this.flight = data.flight;

		this.memberRankName = `${this.memberRank} ${this.getName()}`;
	}

	public getReference = (): MemberReference =>
		typeof this.id === 'string'
			? {
					id: this.id,
					type: 'CAPProspectiveMember'
			  }
			: {
					id: this.id,
					type: 'CAPNHQMember'
			  };

	public hasDutyPosition = (dutyPosition: string | string[]): boolean =>
		typeof dutyPosition === 'string'
			? this.dutyPositions.indexOf(dutyPosition) > -1
			: dutyPosition
					.map(this.hasDutyPosition)
					.reduce((a, b) => a || b, false);

	public async *getAccounts(): AsyncIterableIterator<Account> {
		const accountsCollection = this.schema.getCollection<AccountObject>(
			'Accounts'
		);

		const accountFind = accountsCollection
			.find(':orgIDs in orgIDs')
			.bind('orgIDs', this.orgid);

		const generator = generateResults(accountFind);

		for await (const i of generator) {
			yield Account.Get(i.id, this.schema);
		}
	}
	
	public toRaw (): CAPMemberObject {
		return ({
			...super.toRaw(),
			dutyPositions: this.dutyPositions,
			flight: this.flight,
			memberRank: this.memberRank,
			orgid: this.orgid,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			type: 'CAPNHQMember',
		});
	}
}
