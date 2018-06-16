import { MemberObject, MemberContact } from '../types';
// import Account from './Account';
// import * as mysql from 'promise-mysql';
// import { prettySQL } from './MySQLUtil';

export default class MemberBase implements MemberObject {
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
		ALPHAPAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ASSISTANT : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTEMAIL : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CELLPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		DIGITALPAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		EMAIL : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEFAX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		INSTANTMESSAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ISDN : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		RADIO : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		TELEX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKFAX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' }
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

	public static IsRioux (capid: number): boolean;
	public static IsRioux (member: MemberBase): boolean;
	
	public static IsRioux (cm: MemberBase | number): boolean {
		if (typeof cm === 'number') {
			return (cm === 542488 || cm === 546319);
		} else {
			return cm.isRioux;
		}
	}

	public constructor (data: MemberObject) {
		Object.assign(this, data);

		this.memberRankName = this.memberRank + this.getName();

		this.isRioux = (data.id === 542488 || data.id === 546319);
	}

	public hasDutyPosition (dutyPosition: string | string[]): boolean {
		if (typeof dutyPosition === 'string') {
			return this.dutyPositions.indexOf(dutyPosition) > -1;
		} else {
			return dutyPosition
				.map(this.hasDutyPosition)
				.reduce((a, b) => a || b);
		}
	}

	public getName (): string {
		return [
			this.nameFirst,
			this.nameMiddle,
			this.nameLast,
			this.nameSuffix
		].filter(s => s !== '' && s !== undefined).join(' ');
	}
}

export { default as NHQMember } from './members/NHQMember';
export { MemberRequest } from './members/NHQMember';