import Account from '../Account';
import MemberBase from '../MemberBase';

/**
 * A class to represent the members that sign in to CAPNHQ.gov
 */
export default class CAPNHQMember extends MemberBase
	implements NHQMemberObject {
	/**
	 * This class uses 6 digit CAP IDs
	 */
	public id: number;
	/**
	 * The rank of the member
	 */
	public memberRank: string;
	/**
	 * The member name + the member rank
	 */
	public memberRankName: string;
	/**
	 * Duty positions
	 */
	public dutyPositions: Array<{
		duty: string,
		date: number
	}>;
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: string;
	/**
	 * Filler value
	 */
	public cookie: string = '';

	/**
	 * Descriminator
	 */
	public type: 'CAPNHQMember' = 'CAPNHQMember';

	/**
	 * A basic member that holds information that this site doesn't manage
	 *
	 * @param data The full member object
	 * @param requestingAccount The account that is used to create this member,
	 * 		not the account the member is a part of!
	 * @param sessionID The session ID for this member
	 */
	public constructor(
		data: CAPMemberObject,
		requestingAccount: Account,
		sessionID: string
	) {
		super(data, requestingAccount, sessionID);
	}

	/**
	 * Returns the reference for the current member,
	 * as they are cheaper to move around then full member objects
	 */
	public getReference = (): MemberReference => ({
		id: this.id,
		type: 'CAPNHQMember'
	});

	/**
	 * Converts the member to a full data transfer object
	 */
	public toRaw(): NHQMemberObject {
		return {
			contact: this.contact,
			dutyPositions: this.dutyPositions,
			flight: this.flight,
			id: this.id,
			memberRank: this.memberRank,
			nameFirst: this.nameFirst,
			nameLast: this.nameLast,
			nameMiddle: this.nameMiddle,
			nameSuffix: this.nameSuffix,
			orgid: this.orgid,
			permissions: this.permissions,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			teamIDs: this.teamIDs,
			type: 'CAPNHQMember',
			usrID: this.usrID,
			cookie: '',
			sessionID: this.sessionID
		};
	}

	public hasDutyPosition(dutyPosition: string | string[]): boolean {
		return typeof dutyPosition === 'string'
			? this.dutyPositions.filter(s => s.duty === dutyPosition).length > 0
			: dutyPosition.map(dp => this.hasDutyPosition(dp)).reduce((a, b) => a && b);
	}

	public canManageBlog() {
		return (
			super.canManageBlog() ||
			this.hasDutyPosition([
				'Cadet Public Affairs Officer',
				'Cadet Public Affairs NCO',
				'Public Affairs Officer'
			])
		);
	}

	public getFullName() {
		return `${this.memberRank} ${super.getFullName()}`
	}
}
