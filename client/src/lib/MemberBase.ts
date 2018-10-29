import Account from './Account';
import APIInterface from './APIInterface';
import CAPMember from './members/CAPMember';

export default abstract class MemberBase extends APIInterface
	implements MemberObject {
	public static CreateCorrectObject(obj: Member, acc: Account, sid: string) {
		switch (obj.type) {
			case 'CAPNHQMember' :
				return new CAPMember(obj, acc, sid);

			case 'CAPProspectiveMember' :
				return null;
		}

		return null;
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

	public async getTeams(): Promise<TeamObject[]> {
		const responses = await Promise.all(
			this.teamIDs.map(teamID => this.fetch('/api/team/' + teamID))
		);

		const json = await Promise.all(
			responses.map(team => team.json() as Promise<TeamObject>)
		);

		return json;
	}

	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.join(' ');
}
