import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	AccountObject,
	CAPMemberContact,
	CAPMemberContactType,
	ExtraMemberInformation,
	NHQ,
	NHQMemberObject,
	NHQMemberReference,
	ShortDutyPosition,
	TemporaryDutyPosition
} from 'common-lib';
import { DateTime } from 'luxon';
import {
	Account,
	collectResults,
	findAndBind,
	generateResults,
	getPermissionsForMemberInAccountDefault,
	getUserID,
	MemberBase,
	SessionedUser
} from '../../internals';

export default class CAPNHQMember extends MemberBase implements NHQMemberObject {
	public static async Get(id: number, account: Account, schema: Schema): Promise<CAPNHQMember> {
		const memberTable = schema.getCollection<NHQ.CAPMember>('NHQ_Member');

		const [results, contact, dutyPositions, extraInformation, permissions] = await Promise.all([
			collectResults(findAndBind(memberTable, { CAPID: id })),
			CAPNHQMember.GetCAPWATCHContactForMember(id, schema),
			CAPNHQMember.GetRegularDutypositions(id, schema),
			CAPNHQMember.LoadExtraMemberInformation({ type: 'CAPNHQMember', id }, schema, account),
			getPermissionsForMemberInAccountDefault(schema, { id, type: 'CAPNHQMember' }, account)
		]);

		if (results.length !== 1) {
			throw new Error('Cannot select member');
		}

		const member = new CAPNHQMember(
			{
				id,
				contact,
				// Fully set by updateDutyPositions() below
				dutyPositions,
				memberRank: results[0].Rank,
				nameFirst: results[0].NameFirst,
				nameMiddle: results[0].NameMiddle,
				nameLast: results[0].NameLast,
				nameSuffix: results[0].NameSuffix,
				seniorMember: results[0].Type !== 'CADET',
				squadron: `${results[0].Region}-${results[0].Wing}-${results[0].Unit}`,
				orgid: results[0].ORGID,
				usrID: getUserID([
					results[0].NameFirst,
					results[0].NameMiddle,
					results[0].NameLast,
					results[0].NameSuffix
				]),
				type: 'CAPNHQMember',
				teamIDs: extraInformation.teamIDs,
				flight: extraInformation.flight,
				absenteeInformation: extraInformation.absentee,
				permissions,
				expirationDate: +DateTime.fromISO(results[0].Expiration)
			},
			schema,
			account,
			extraInformation
		);

		member.updateDutyPositions();

		return member;
	}

	private static async GetCAPWATCHContactForMember(id: number, schema: Schema) {
		const memberContactTable = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

		const capwatchContact = await collectResults(
			findAndBind(memberContactTable, { CAPID: id })
		);

		const memberContact: CAPMemberContact = {
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

		capwatchContact.forEach(val => {
			if ((val.Type as string) !== '' && (val.Type as string) !== '--Select Type--') {
				memberContact[val.Type.toUpperCase().replace(/ /g, '') as CAPMemberContactType][
					val.Priority
				] = val.Contact;
			}
		});

		return memberContact;
	}

	private static GetRegularDutypositions = async (
		capid: number,
		schema: Schema
	): Promise<Array<{ duty: string; date: number; type: 'NHQ' }>> =>
		(
			await Promise.all([
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
			])
		)
			.reduce((prev, curr) => [...prev, ...curr])
			.map(item => ({
				duty: item.Duty,
				date: +DateTime.fromISO(item.DateMod),
				type: 'NHQ' as 'NHQ'
			}));

	/**
	 * Restrict IDs to numbers
	 */
	public id: number;
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
	 * When the membership lapses for this particular user
	 */
	public expirationDate: number;
	/**
	 * Ditto above but as a more usable DateTime object
	 */
	public expirationDateObject: DateTime;
	/**
	 * How long a member may be absent for
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Used to differentiate between members
	 */
	public readonly type = 'CAPNHQMember' as const;

	public constructor(
		data: NHQMemberObject,
		schema: Schema,
		account: Account,
		extraInfo: ExtraMemberInformation
	) {
		super(data, schema, account, extraInfo);

		this.id = data.id;
		this.memberRank = data.memberRank;
		this.seniorMember = data.seniorMember;
		this.memberRankName = this.getFullName();
		this.dutyPositions = data.dutyPositions;
		this.orgid = data.orgid;
		this.flight = data.flight;
		this.squadron = data.squadron;
		this.absenteeInformation = extraInfo.absentee;
		this.expirationDate = data.expirationDate;
		this.expirationDateObject = DateTime.fromMillis(data.expirationDate);
	}

	public getReference = (): NHQMemberReference => ({
		type: 'CAPNHQMember',
		id: this.id
	});

	public toRaw(): NHQMemberObject {
		return {
			...super.toRaw(),
			dutyPositions: this.dutyPositions,
			flight: this.flight,
			memberRank: this.memberRank,
			orgid: this.orgid,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			type: 'CAPNHQMember',
			id: this.id,
			absenteeInformation: this.absenteeInformation,
			permissions: this.permissions,
			expirationDate: this.expirationDate
		};
	}

	public addTemporaryDutyPosition(position: TemporaryDutyPosition) {
		for (const tempPosition of this.extraInformation.temporaryDutyPositions) {
			if (tempPosition.Duty === position.Duty) {
				tempPosition.validUntil = position.validUntil;
				tempPosition.assigned = position.assigned;
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

	public getFullName() {
		return `${this.memberRank} ${super.getFullName()}`;
	}

	public hasDutyPosition = (dutyPosition: string | string[]): boolean =>
		this.isRioux ||
		(typeof dutyPosition === 'string'
			? this.dutyPositions.filter(duty => duty.duty === dutyPosition).length > 0
			: dutyPosition.map(this.hasDutyPosition).reduce((a, b) => a || b, false));

	public async *getAccounts(): AsyncIterableIterator<Account> {
		const accountsCollection = this.schema.getCollection<AccountObject>('Accounts');

		const accountFind = accountsCollection.find(':orgIDs in orgIDs').bind('orgIDs', this.orgid);

		const generator = generateResults(accountFind);

		for await (const i of generator) {
			yield Account.Get(i.id, this.schema);
		}
	}

	public async *getMainAccounts(): AsyncIterableIterator<Account> {
		const accountsCollection = this.schema.getCollection<AccountObject>('Accounts');

		const accountFind = findAndBind(accountsCollection, {
			mainOrg: this.orgid
		});

		const generator = generateResults(accountFind);

		for await (const i of generator) {
			yield Account.Get(i.id, this.schema);
		}
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

export class CAPNHQUser extends SessionedUser(CAPNHQMember) {}
