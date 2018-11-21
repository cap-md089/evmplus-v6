import APIInterface from './APIInterface';
import Event from './Event';
import FileInterface from './File';
import MemberBase from './MemberBase';
import { createCorrectMemberObject, MemberClasses } from './Members';
import myFetch from './myFetch';
import Team from './Team';

export default class Account extends APIInterface<AccountObject>
	implements AccountObject {
	public static async Get(id?: string) {
		let promise;

		if (id) {
			promise = await myFetch(
				`https://${id}.${Account.REQUEST_URI}/api/accountcheck`
			);
		} else {
			promise = await myFetch('/api/accountcheck');
		}

		const json = (await promise.json()) as AccountObject;

		return new this(json);
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

	protected constructor(data: AccountObject) {
		super(data.id);

		Object.assign(this, data);
	}

	public async getMembers(member?: MemberBase): Promise<MemberClasses[]> {
		const url = this.buildURI('api', 'member');

		const headers: any = {};

		if (member) {
			headers.authorization = member.sessionID;
		}

		const results = await myFetch(url, {
			headers
		});

		const json = (await results.json()) as Member[];

		return json
			.map(v => createCorrectMemberObject(v, this, ''))
			.filter(v => !!v) as MemberClasses[];
	}

	public async getEvents(member?: MemberBase): Promise<Event[]> {
		const url = this.buildURI('api', 'event');

		const results = await this.fetch(url, {}, member);

		const events = await results.json();

		return events.map((e: EventObject) => new Event(e, this));;
	}

	public async getTeams(member?: MemberBase): Promise<Team[]> {
		const url = this.buildURI('api', 'team');

		const results = await this.fetch(url, {}, member);

		const teams = await results.json();

		return teams.map((t: TeamObject) => new Team(t, this));
	}

	public async getBasicFiles(target: FileInterface | string, member?: MemberBase | null) {
		if (target instanceof FileInterface) {
			target = target.id;
		}

		const url = this.buildURI('api', 'files', target, 'children');

		const results = await this.fetch(url, {}, member);

		return results.json() as Promise<FileObject[]>;
	}

	public async getFiles(target: FileInterface | string, member?: MemberBase | null): Promise<FileInterface[]> {
		if (target instanceof FileInterface) {
			target = target.id;
		}

		const url = this.buildURI('api', 'files', target, 'children', 'dirty');

		const results = await this.fetch(url, {}, member);

		const files = await results.json();

		return files.map((f: FullFileObject) => new FileInterface(f, this));
	}

	public toRaw(): AccountObject {
		return {
			adminIDs: this.adminIDs,
			echelon: this.echelon,
			expired: this.expired,
			id: this.id,
			expires: this.expires,
			mainOrg: this.mainOrg,
			orgIDs: this.orgIDs,
			paid: this.paid,
			paidEventLimit: this.paidEventLimit,
			unpaidEventLimit: this.unpaidEventLimit,
			validPaid: this.validPaid
		};
	}
}
