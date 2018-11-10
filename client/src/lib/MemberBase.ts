import Account from './Account';
import APIInterface from './APIInterface';
import Team from './Team';

export default abstract class MemberBase extends APIInterface<MemberObject>
	implements MemberObject {
	public static AreMemberReferencesTheSame(
		ref1: MemberReference,
		ref2: MemberReference
	) {
		return ref1.type === 'Null' || ref2.type === 'Null'
			? false
			: ref1.id === ref2.id;
	}

	/**
	 * User ID
	 */
	public id: number | string = 0;
	/**
	 * Whether or not the member is a senior member
	 */
	public seniorMember: boolean = false;
	/**
	 * Contact information
	 */
	public contact: CAPMemberContact = {
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
	 * The IDs of teams the member is a part of
	 */
	public teamIDs: number[] = [];
	/**
	 * The User ID
	 */
	public usrID: string;
	/**
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;
	/**
	 * Checks for if a user has permissions
	 */
	public permissions: MemberPermissions;
	/**
	 * Cheap way to produce references
	 */
	public abstract getReference: () => MemberReference;
	/**
	 * Used to differentiate when using polymorphism
	 *
	 * Another method is the instanceof operator, but to each their own
	 * That method would probably work better however
	 */
	public abstract type: MemberType;

	public constructor(
		data: MemberObject,
		protected requestingAccount: Account,
		public sessionID: string
	) {
		super(requestingAccount.id);

		Object.assign(this, data);
	}

	public matchesReference(ref: MemberReference): boolean {
		return ref.type === this.type && ref.id === this.id;
	}

	public async getTeams(): Promise<Team[]> {
		const responses = await Promise.all(
			this.teamIDs.map(teamID =>
				Team.Get(teamID, this.requestingAccount, this)
			)
		);

		return responses;
	}

	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.join(' ');

	public hasPermission = (
		permission: MemberPermission | MemberPermission[],
		threshold = 1
	): boolean =>
		typeof permission === 'string'
			? this.permissions[permission] >= threshold
			: permission
					.map(perm => this.hasPermission(perm, threshold))
					.reduce((a, b) => a || b, false);

	public is(mem: MemberBase) {
		return this.matchesReference(mem.getReference());
	}
}
