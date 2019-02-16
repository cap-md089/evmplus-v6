import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import MemberBase from '../MemberBase';
import { collectResults, findAndBind, generateResults } from '../MySQLUtil';
import { getPermissions } from '../Permissions';

export default class CAPWATCHMember extends MemberBase implements CAPMemberObject {
	public static readonly tableNames = {
		member: 'NHQ_Member',
		contact: 'NHQ_MbrContact'
	};

	public static async Get(id: number, account: Account, schema: Schema): Promise<CAPWATCHMember> {
		const memberTable = schema.getCollection<NHQ.Member>(this.tableNames.member);
		const memberContactTable = schema.getCollection<NHQ.MbrContact>(this.tableNames.contact);

		const [results, capwatchContact, dutyPositions, extraInformation] = await Promise.all([
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
			CAPWATCHMember.GetRegularDutypositions(id, schema),
			CAPWATCHMember.LoadExtraMemberInformation(
				{
					type: 'CAPNHQMember',
					id
				},
				schema,
				account
			)
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
			if ((val.Type as string) !== '' && (val.Type as string) !== '--Select Type--') {
				contact[val.Type.toUpperCase().replace(/ /g, '') as CAPMemberContactType][
					val.Priority
				] = val.Contact;
			}
		});

		const temporaryDutyPositions = extraInformation.temporaryDutyPositions
			.filter(val => val.validUntil > +DateTime.utc())
			.map(val => ({
				duty: val.Duty,
				date: val.assigned
			}));

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
				squadron: `${results[0].Region}-${results[0].Wing}-${results[0].Unit}`,
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
				flight: extraInformation.flight,
				absenteeInformation: extraInformation.absentee
			},
			schema,
			account,
			extraInformation
		);
	}

	protected static GetRegularDutypositions = async (
		capid: number,
		schema: Schema
	): Promise<Array<{ duty: string; date: number }>> =>
		(await Promise.all([
			collectResults(
				schema
					.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition')
					.find('CAPID = :CAPID')
					.bind('CAPID', capid)
			),
			collectResults(
				schema
					.getCollection<NHQ.CadetDutyPosition>('NHQ_CadetDutyPosition')
					.find('CAPID = :CAPID')
					.bind('CAPID', capid)
			)
		]))
			.reduce((prev, curr) => [...prev, ...curr])
			.map(item => ({
				duty: item.Duty,
				date: +DateTime.fromISO(item.DateMod)
			}));

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
	public dutyPositions: Array<{ date: number; duty: string }>;
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: null | string;
	/**
	 * How long the member is absent for
	 */
	public absenteeInformation: AbsenteeInformation | null;

	protected constructor(
		data: CAPMemberObject,
		schema: Schema,
		requestingAccount: Account,
		protected extraInformation: ExtraMemberInformation
	) {
		super(data, schema, requestingAccount);

		this.memberRank = data.memberRank;
		this.seniorMember = data.seniorMember;
		this.dutyPositions = data.dutyPositions;
		this.orgid = data.orgid;
		this.flight = data.flight;

		this.memberRankName = `${this.memberRank} ${this.getName()}`;
	}

	public getFullName() {
		return `${this.memberRank} ${this.getName()}`;
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
			? this.dutyPositions.filter(duty => duty.duty === dutyPosition).length > 0
			: dutyPosition.map(this.hasDutyPosition).reduce((a, b) => a || b, false);

	public async *getAccounts(): AsyncIterableIterator<Account> {
		const accountsCollection = this.schema.getCollection<AccountObject>('Accounts');

		const accountFind = accountsCollection.find(':orgIDs in orgIDs').bind('orgIDs', this.orgid);

		const generator = generateResults(accountFind);

		for await (const i of generator) {
			yield Account.Get(i.id, this.schema);
		}
	}

	public toRaw(): CAPMemberObject {
		return {
			...super.toRaw(),
			dutyPositions: this.dutyPositions,
			flight: this.flight,
			memberRank: this.memberRank,
			orgid: this.orgid,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			type: 'CAPNHQMember',
			absenteeInformation: this.absenteeInformation
		};
	}

	public async saveExtraMemberInformation(schema: Schema) {
		const extraInfoCollection = schema.getCollection<ExtraMemberInformation>(
			'ExtraMemberInformation'
		);

		await extraInfoCollection
			.modify('id = :id AND type = :type')
			.bind({
				id: this.id,
				type: this.type
			})
			.patch(this.extraInformation)
			.execute();
	}

	public setAbsenteeInformation(info: AbsenteeInformation) {
		this.extraInformation.absentee = info;
	}

	public setFlight(flight: string) {
		this.extraInformation.flight = flight;
	}
}

import Account from '../Account';
