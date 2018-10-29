import MemberBase from "../MemberBase";

export default class CAPMember extends MemberBase implements CAPMemberObject {
	/**
	 * This class uses 6 digit CAP IDs
	 */
	public id: number = 0;
	/**
	 * The rank of the member
	 */
	public memberRank: string = '';
	/**
	 * The member name + the member rank
	 */
	public memberRankName: string = '';
	/**
	 * Duty positions
	 */
	public dutyPositions: string[] = [];
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number = 0;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: string;

	public type: CAPMemberType = 'CAPNHQMember';

	public getReference = (): MemberReference => ({
		id: this.id,
		type: 'CAPNHQMember'
	})
}