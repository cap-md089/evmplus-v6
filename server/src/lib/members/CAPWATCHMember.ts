import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	AccountObject,
	CAPMemberContact,
	CAPMemberContactType,
	CAPMemberObject,
	CAPMemberType,
	ExtraMemberInformation,
	MemberPermissions,
	MemberReference,
	NHQ,
	ShortDutyPosition,
	TemporaryDutyPosition
} from 'common-lib';
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
				date: val.assigned,
				type: 'CAPUnit' as 'CAPUnit',
				expires: val.validUntil
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
				absenteeInformation: extraInformation.absentee,
				accessLevel: extraInformation.accessLevel
			},
			schema,
			account,
			extraInformation
		);
	}

	protected static GetRegularDutypositions = async (
		capid: number,
		schema: Schema
	): Promise<Array<{ duty: string; date: number; type: 'NHQ' }>> =>
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
				date: +DateTime.fromISO(item.DateMod),
				type: 'NHQ' as 'NHQ'
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
	public dutyPositions: ShortDutyPosition[];
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: null | string;
	/**
	 * Member squardon
	 */
	public squadron: string;
	/**
	 * How long the member is absent for
	 */
	public absenteeInformation: AbsenteeInformation | null;

	protected constructor(
		data: CAPMemberObject,
		schema: Schema,
		requestingAccount: Account,
		extraInformation: ExtraMemberInformation
	) {
		super(data, schema, requestingAccount, extraInformation);

		this.id = data.id;
		this.absenteeInformation = extraInformation.absentee;
		this.memberRank = data.memberRank;
		this.permissions = data.permissions;
		this.squadron = data.squadron;

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

	public setFlight(flight: string) {
		this.extraInformation.flight = flight;
	}

	public addTemporaryDutyPosition(position: TemporaryDutyPosition) {
		for (let i = 0; i < this.extraInformation.temporaryDutyPositions.length; i++) {
			if (this.extraInformation.temporaryDutyPositions[i].Duty === position.Duty) {
				this.extraInformation.temporaryDutyPositions[i].validUntil = position.validUntil;
				this.extraInformation.temporaryDutyPositions[i].assigned = position.assigned;
				return;
			}
		}

		this.extraInformation.temporaryDutyPositions.push({
			Duty: position.Duty,
			assigned: position.assigned,
			validUntil: position.validUntil
		});

		this.updateDutyPositions();
	}

	public removeDutyPosition(duty: string) {
		if (this.extraInformation.temporaryDutyPositions.length === 0) {
			this.updateDutyPositions();
			return;
		}
		for (let i = this.extraInformation.temporaryDutyPositions.length - 1; i >= 0; i--) {
			if (this.extraInformation.temporaryDutyPositions[i].Duty === duty) {
				this.extraInformation.temporaryDutyPositions.splice(i, 1);
			}
		}

		this.updateDutyPositions();
	}

	private updateDutyPositions() {
		this.dutyPositions = [
			...this.dutyPositions.filter(v => v.type === 'NHQ'),
			...this.extraInformation.temporaryDutyPositions.map(v => ({
				type: 'CAPUnit' as 'CAPUnit',
				expires: v.validUntil,
				duty: v.Duty,
				date: v.assigned
			}))
		];
	}
}
