import Account from '../Account';
import MemberBase from '../MemberBase';

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

	public constructor(
		data: CAPMemberObject,
		requestingAccount: Account,
		sessionID: string
	) {
		super(data, requestingAccount, sessionID);
	}

	public getReference = (): MemberReference => ({
		id: this.id,
		type: 'CAPNHQMember'
	});

	public toRaw(): CAPMemberObject {
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
			usrID: this.usrID
		};
	}
}
