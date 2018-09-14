import { Schema } from '@mysql/xdevapi';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class MemberBase implements MemberObject {
	public static IsRioux = (cm: MemberBase | number): boolean =>
		typeof cm === 'number' ? cm === 542488 || cm === 546319 : cm.isRioux;

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
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;

	public constructor(
		data: MemberObject,
		protected schema: Schema,
		protected requestingAccount: Account
	) {
		Object.assign(this, data);

		this.memberRankName = `${this.memberRank} ${this.getName()}`;

		this.isRioux = data.id === 542488 || data.id === 546319;
	}

	public hasDutyPosition(dutyPosition: string | string[]): boolean {
		if (typeof dutyPosition === 'string') {
			return this.dutyPositions.indexOf(dutyPosition) > -1;
		} else {
			return dutyPosition
				.map(this.hasDutyPosition)
				.reduce((a, b) => a || b);
		}
	}

	public getName(): string {
		return [this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.join(' ');
	}

	public toRaw(): MemberObject {
		return {
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
			orgid: this.orgid
		};
	}
}

export { default as NHQMember, MemberRequest } from './members/NHQMember';
