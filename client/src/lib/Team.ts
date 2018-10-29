import APIInterface from "./APIInterface";
import { TeamPublicity } from "../enums";
import Account from "./Account";

export default class Team extends APIInterface implements TeamObject {
	public static async Get(id: string, account: Account) {
		let result;
		try {
			result = await account.fetch('/api/team/' + id, {
				headers: {
					authorization: account.getSessionID()
				}
			});
		} catch (e) {
			throw new Error('Could not get account');
		}

		const json = await result.json();

		return new Team(json, account);
	}

	public get accountID () {
		return this.account.id;
	}

	public cadetLeader: MemberReference | null;

	public description: string;

	public id: number;

	public members: MemberReference[];

	public name: string;

	public seniorCoach: MemberReference;

	public seniorMentor: MemberReference;

	public visiblity: TeamPublicity = TeamPublicity.PUBLIC;

	private account: Account;

	private constructor(obj: TeamObject, account: Account) {
		super(account.id);

		Object.assign(this, obj);
	}
}