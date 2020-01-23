import {
	AccountObject,
	EventObject,
	FileObject,
	FullFileObject,
	FullTeamObject,
	Member,
	Timezone,
	MemberReference,
	StoredMemberPermissions
} from 'common-lib';
import APIInterface from './APIInterface';
import Event from './Event';
import FileInterface from './File';
import MemberBase from './MemberBase';
import { CAPMemberClasses, createCorrectMemberObject } from './Members';
import myFetch from './myFetch';
import Team from './Team';

/**
 * Holds the account information for a provided account
 */
export default class Account extends APIInterface<AccountObject> implements AccountObject {
	/**
	 * Constructs an Account object for the given ID
	 * @param id The ID of the account to get
	 * 		If not defined, it will fetch the account for the current page
	 * 		Repeated calls with an undefined ID are not problematic, as the
	 * 		results are cached. Causing a page refresh to go to another
	 * 		account clears the cache
	 */
	public static async Get(id?: string) {
		let json: AccountObject;

		if (id) {
			const promise = await myFetch(`https://${id}.${Account.REQUEST_URI}/api/accountcheck`);
			json = (await promise.json()) as AccountObject;
		} else {
			if (!Account.cache) {
				const promise = await myFetch('/api/accountcheck');
				json = (await promise.json()) as AccountObject;
				Account.cache = json;
			} else {
				json = Account.cache;
			}
		}

		return new this(json);
	}

	/**
	 * Make repeated calls to Account#Get() efficient
	 */
	private static cache: AccountObject | null = null;

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

	public aliases: string[];

	protected constructor(data: AccountObject) {
		super(data.id);

		this.adminIDs = data.adminIDs;
		this.echelon = data.echelon;
		this.expired = data.expired;
		this.expires = data.expires;
		this.id = data.id;
		this.mainOrg = data.mainOrg;
		this.orgIDs = data.orgIDs;
		this.paid = data.paid;
		this.paidEventLimit = data.paidEventLimit;
		this.unpaidEventLimit = data.unpaidEventLimit;
		this.validPaid = data.validPaid;
		this.aliases = data.aliases;
	}

	public async getMembers(member?: MemberBase | null): Promise<CAPMemberClasses[]> {
		const url = this.buildURI('api', 'member');

		const results = await this.fetch(url, {}, member);

		const json = (await results.json()) as Member[];

		return json
			.map(v => createCorrectMemberObject(v, this, ''))
			.filter(v => !!v) as CAPMemberClasses[];
	}

	public async setMemberPermissions(member: MemberBase, members: MemberBase[]) {
		if (!member.hasPermission('PermissionManagement')) {
			return;
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/member/permissions`,
			{
				method: 'POST',
				body: JSON.stringify({
					newRoles: members.map(mem => ({
						member: mem.getReference(),
						permissions: mem.permissions
					})),
					token
				})
			},
			member
		);
	}

	public async getEvents(member?: MemberBase | null): Promise<Event[]> {
		const url = this.buildURI('api', 'event');

		const results = await this.fetch(url, {}, member);

		const events = await results.json();

		return events.map((e: EventObject) => new Event(e, this));
	}

	public async getNextRecurringEvent(): Promise<Event | null> {
		const url = this.buildURI('api', 'event', 'recurring');

		try {
			const results = await this.fetch(url);

			const event = await results.json();

			return new Event(event, this);
		} catch (e) {
			if (e.status === 404) {
				return null;
			}

			throw e;
		}
	}

	public async getUpcomingEvents(): Promise<Event[]> {
		const url = this.buildURI('api', 'event', 'upcoming');

		const results = await this.fetch(url);

		const events = await results.json();

		return events.map((e: EventObject) => new Event(e, this));
	}

	public async getTeams(member?: MemberBase | null): Promise<Team[]> {
		const url = this.buildURI('api', 'team');

		const results = await this.fetch(url, {}, member);

		const teams = await results.json();

		return teams.map((t: FullTeamObject) => new Team(t, this));
	}

	/**
	 * This method does not return fully qualified file objects, it returns basic information
	 *
	 * @param target The file to get the children of
	 * @param member Used for checking the permissions of the file
	 */
	public async getBasicFiles(target: FileInterface | string, member?: MemberBase | null) {
		if (target instanceof FileInterface) {
			target = target.id;
		}

		const url = this.buildURI('api', 'files', target, 'children');

		const results = await this.fetch(url, {}, member);

		return results.json() as Promise<FileObject[]>;
	}

	/**
	 * This method returns full file objects for the given file, which includes the parent files
	 *
	 * @param target The file to get the children of
	 * @param member Used for checking the permissions of the file
	 */
	public async getFiles(
		target: FileInterface | string,
		member?: MemberBase | null
	): Promise<FileInterface[]> {
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
			validPaid: this.validPaid,
			aliases: this.aliases
		};
	}
}
