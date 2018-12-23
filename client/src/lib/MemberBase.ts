import Account from './Account';
import APIInterface from './APIInterface';
import Team from './Team';

export default abstract class MemberBase extends APIInterface<MemberObject>
	implements MemberObject {
	/**
	 * Checks that two member references point to the same person
	 * 
	 * @param ref1 The first member reference
	 * @param ref2 The second memeber reference
	 */
	public static AreMemberReferencesTheSame(
		ref1: MemberReference,
		ref2: MemberReference
	) {
		return ref1.type === 'Null' || ref2.type === 'Null'
			? false
			: ref1.id === ref2.id;
	}

	/**
	 * Whether or not members marked isRioux are super admins
	 */
	private static readonly useRiouxPermission = false;

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

	/**
	 * Initializes the fields for a member object
	 * 
	 * TODO: Don't use Object#assign()
	 * 
	 * @param data The member object that this member represents
	 * @param requestingAccount The account that is used to get this member,
	 * 		not the account the member belongs to!
	 * @param sessionID The session ID for the member
	 */
	public constructor(
		data: MemberObject,
		protected requestingAccount: Account,
		public sessionID: string
	) {
		super(requestingAccount.id);

		Object.assign(this, data);
	}

	/**
	 * Similar to MemberBase#AreMemberReferencesTheSame
	 * 
	 * @param ref The reference to check
	 */
	public matchesReference(ref: MemberReference): boolean {
		return ref.type === this.type && ref.id === this.id;
	}

	/**
	 * Gets the teams the member is a part of
	 */
	public async getTeams(): Promise<Team[]> {
		const responses = await Promise.all(
			this.teamIDs.map(teamID =>
				Team.Get(teamID, this.requestingAccount, this)
			)
		);

		return responses;
	}

	/**
	 * Convenient function for getting the name of a person
	 * 
	 * It used to try to standardize the input, but it does not do as much anymore
	 * Names are stupidly inconsistent...
	 */
	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.map(value => value.trimLeft().trimRight())
			.map(value => value.replace(/\r\n/gm, ''))
			.map(value => value.replace(/(  +)/g, ' '))
			.map((value, i) => (i === 1 ? value.charAt(0) : value))
			.filter(s => !!s)
			.join(' ');

	/**
	 * Checks if the user has permission to do what is requested
	 * 
	 * Allows for a threshold to be given, but most permissions are boolean
	 * However, there are some permissions with multiple levels
	 * 
	 * Also checks for if the member is marked isRioux, allowing for super
	 * admins
	 */
	public hasPermission = (
		permission: MemberPermission | MemberPermission[],
		threshold = 1
	): boolean =>
		(MemberBase.useRiouxPermission && this.isRioux)
			? true
			: typeof permission === 'string'
				? this.permissions[permission] >= threshold
				: permission
					.map(perm => this.hasPermission(perm, threshold))
					.reduce((a, b) => a || b, false);

	/**
	 * Checks if the member matches without using the == operator, as that
	 * checks JavaScript references vs. Member references
	 * 
	 * @param mem The member to check
	 */
	public is(mem: MemberBase) {
		return this.matchesReference(mem.getReference());
	}

	/**
	 * Returns the best email for the member
	 * 
	 * There is an order of priority and email vs parent emails
	 */
	public getBestEmail = () =>
		this.contact.EMAIL.PRIMARY ||
		this.contact.CADETPARENTEMAIL.PRIMARY ||
		this.contact.EMAIL.SECONDARY ||
		this.contact.CADETPARENTEMAIL.SECONDARY ||
		this.contact.EMAIL.EMERGENCY ||
		this.contact.CADETPARENTEMAIL.EMERGENCY;

	/**
	 * Returns the best phone number for the member
	 * 
	 * There is an order of priority and email vs parent emails
	 */
	public getBestPhone = () =>
		this.contact.CELLPHONE.PRIMARY ||
		this.contact.CADETPARENTPHONE.PRIMARY ||
		this.contact.CELLPHONE.SECONDARY ||
		this.contact.CADETPARENTPHONE.SECONDARY ||
		this.contact.CELLPHONE.EMERGENCY ||
		this.contact.CADETPARENTPHONE.EMERGENCY;
}
