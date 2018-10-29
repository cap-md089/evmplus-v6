import myFetch from "./myFetch";
import APIInterface from "./APIInterface";

export default class Account extends APIInterface implements AccountObject {
	public static async Get(sessionID?: string, id?: string) {
		let promise;

		if (id) {
			promise = await myFetch(`https://${id}.${Account.REQUEST_URI}/api/accountcheck`);
		} else {
			promise = await myFetch('/api/accountcheck');
		}

		const json = await promise.json() as AccountObject;

		return new this(json, sessionID);
	}

	public adminIDs: MemberReference[];

	public echelon: boolean;

	public expired: boolean;

	public expires: number;

	public id: string;

	public mainOrg: number;

	public orgIDs: number[];

	public paid: boolean;

	public paidEventLimit: number;

	public unpaidEventLimit: number;

	public validPaid: boolean;

	protected constructor(data: AccountObject, private sessionID?: string) {
		super(data.id);

		Object.assign(this, data);
	}

	public async getMembers(): Promise<MemberObject[]> {
		const url = this.buildURI('api', 'members');

		const headers: any = {};

		if (this.sessionID) {
			headers.authorization = this.sessionID;
		}

		const results = await myFetch(url, {
			headers
		});

		return results.json();
	}

	public async getEvents(): Promise<EventObject[]> {
		const url = this.buildURI('api', 'event');

		const headers: any = {};

		if (this.sessionID) {
			headers.authorization = this.sessionID;
		}

		const results = await myFetch(url, {
			headers
		});

		return results.json();
	}

	public async getTeams(): Promise<TeamObject[]> {
		const url = this.buildURI('api', 'team');

		const headers: any = {};

		if (this.sessionID) {
			headers.authorization = this.sessionID;
		}

		const results = await myFetch(url, {
			headers
		});

		return results.json();
	}

	public setSessionID(value: SigninReturn) {
		this.sessionID = value.sessionID;
	}
}