import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class MemberBase implements MemberObject {
	public static IsRioux = (cm: MemberBase | number): boolean =>
		typeof cm === 'number' ? (cm === 542488 || cm === 546319) : cm.isRioux;

	protected static GetDutypositions = async (
		capid: number,
		schema: Schema,
		account: Account
	): Promise<string[]> => [
		/**
		 * Get the duty positions from the CAPWATCH database
		 */
		...(await Promise.all([
			collectResults(
				schema
					.getTable<{ capid: number, Duty: string }>(
						'Data_DutyPosition'
					)
					.select('Duty')
					.where('CAPID = :capid')
					.bind('capid', capid)
			),
			collectResults(
				schema
					.getTable<{ capid: number, Duty: string }>(
						'Data_CadetDutyPosition'
					)
					.select('Duty')
					.where('CAPID = :capid')
					.bind('capid', capid)
			)
		]))
			// Flatten the array
			.reduce((prev, curr) => [...prev, ...curr], [])
			.map(dutyItem => dutyItem.Duty),

		/**
		 * Get the temporary duty positions from our database
		 */
		...(await (async (): Promise<string[]> => {
			const results = await collectResults(
				findAndBind(
					schema.getCollection<ExtraMemberInformation>(
						'ExtraMemberInformation'
					),
					{
						id: capid
					}
				)
			);

			if (results.length === 0) {
				return [];
			}

			// Get the valid temporary duty positions, mapping to the string representation
			return results[0]
				.temporaryDutyPositions
				.filter(
					temporaryDutyPositions =>
						temporaryDutyPositions.validUntil > +DateTime.utc()
				)
				.map(item => item.Duty)
		})())
	];

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
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;

	public constructor(data: MemberObject) {
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
			.filter(s => s !== '' && s !== undefined)
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
			squadron: this.squadron
		};
	}
}

export { default as NHQMember, MemberRequest } from './members/NHQMember';
