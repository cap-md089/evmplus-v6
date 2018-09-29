import myFetch from "./myFetch";

export default class Account implements AccountObject {
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

	private static REQUEST_URI = process.env.NODE_ENV === 'production' ? 'capunit.com' : 'localcapunit.com';

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

	private constructor(data: AccountObject, private sessionID?: string) {
		Object.assign(this, data);
	}

	public buildURI(...components: string[]): string {
		let uri = `https://${this.id}.${Account.REQUEST_URI}/`;

		for (const i in components) {
			if (components.hasOwnProperty(i)) {
				uri += components[i] + `/`;
			}
		}

		return uri.slice(0, -1);
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