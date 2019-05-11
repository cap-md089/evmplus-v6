import Account from '../Account';
import MemberBase from '../MemberBase';
import { ProspectiveMemberObject, AbsenteeInformation, MemberReference, ShortDutyPosition } from 'common-lib';

/**
 * A class to represent those wanting to join a CAP squadron
 */
export default class CAPProspectiveMember extends MemberBase
	implements ProspectiveMemberObject {
	/**
	 * The ID of the user
	 */
	public id: string;
	/**
	 * The password, ignored because the password is never sent to the clients
	 */
	public password: '' = '';
	/**
	 * The password salt, ignored because the password is never sent to the clients
	 */
	public salt: '' = '';
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
	public dutyPositions: ShortDutyPosition[];
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: string | null;
	/**
	 * Describes how long the member is absent for
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Member squardon
	 */
	public squadron: string;
	/**
	 * Whether or not the member is a senior member
	 */
	public seniorMember: boolean;

	/**
	 * Descriminator for TypeScript
	 */
	public type: 'CAPProspectiveMember' = 'CAPProspectiveMember';

	/**
	 * 
	 * 
	 * @param data 
	 * @param requestingAccount 
	 * @param sessionID 
	 */
	public constructor(
		data: ProspectiveMemberObject,
		requestingAccount: Account,
		sessionID: string
	) {
		super(data, requestingAccount, sessionID);

		this.id = data.id;
		this.memberRank = data.memberRank;
		this.memberRankName = `${this.memberRank} ${this.getName()}`;
		this.dutyPositions = data.dutyPositions;
		this.orgid = data.orgid;
		this.flight = data.flight;
		this.absenteeInformation = data.absenteeInformation;
		this.squadron = data.squadron;
		this.seniorMember = data.seniorMember;
	}

	public getReference = (): MemberReference => ({
		id: this.id,
		type: 'CAPProspectiveMember'
	});

	public toRaw(): ProspectiveMemberObject {
		return {
			contact: this.contact,
			password: '',
			salt: '',
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
			type: 'CAPProspectiveMember',
			usrID: this.usrID,
			accountID: this.accountID,
			absenteeInformation: this.absenteeInformation,
			accessLevel: this.accessLevel
		};
	}

	public getFullName() {
		return `${this.memberRank} ${super.getFullName()}`
	}

	public hasDutyPosition(dutyPosition: string | string[]): boolean {
		return (
			this.isRioux ||
			(typeof dutyPosition === 'string'
				? this.dutyPositions.filter(s => s.duty === dutyPosition).length > 0
				: dutyPosition.map(dp => this.hasDutyPosition(dp)).reduce((a, b) => a && b))
		);
	}

	public async saveAbsenteeInformation(): Promise<void> {
		const token = await this.getToken(this);

		await this.fetch(
			`/api/member/absent`,
			{
				method: 'POST',
				body: JSON.stringify({
					token,
					...this.absenteeInformation
				})
			},
			this
		);
	}

	public async saveTemporaryDutyPositions() {
		const token = await this.getToken(this);

		await this.fetch(
			`/api/member/tempdutypositions/${this.type}/${this.id}`,
			{
				method: 'POST',
				body: JSON.stringify({
					dutyPositions: this.dutyPositions.filter(
						d => d.type === 'CAPUnit'
					),
					token
				})
			},
			this
		);
	}
}
