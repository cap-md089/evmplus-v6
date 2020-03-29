import {
	AccountObject,
	EventObject,
	FileObject,
	FullFileObject,
	FullTeamObject,
	Member,
	MemberReference,
	maybe,
	EitherObj,
	api,
	MaybeObj,
	either,
	Maybe,
	isValidEither
} from 'common-lib';
import APIInterface from './APIInterface';
import Event from './Event';
import FileInterface from './File';
import MemberBase from './MemberBase';
import { CAPMemberClasses, createCorrectMemberObject } from './Members';
import myFetch from './myFetch';
import Team from './Team';
import Registry from './Registry';

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

	public mainCalendarID: string;

	public wingCalendarID: string;

	public shareLink: string;

	public comments: string;

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

	public serviceAccount: MaybeObj<string>;

	protected constructor(data: AccountObject) {
		super(data.id);

		this.adminIDs = data.adminIDs;
		this.mainCalendarID = data.mainCalendarID;
		this.wingCalendarID = data.wingCalendarID;
		this.serviceAccount = data.serviceAccount;
		this.shareLink = data.shareLink;
		this.comments = data.comments;
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
		this.wingCalendarID = data.wingCalendarID;
		this.mainCalendarID = data.mainCalendarID;
		this.comments = data.comments;
		this.serviceAccount = data.serviceAccount;
		this.shareLink = data.shareLink;
	}

	public async getMembers(member?: MemberBase | null): Promise<CAPMemberClasses[]> {
		const results = await this.fetch(`/api/member`, {}, member);

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
		const results = await this.fetch(`/api/event`, {}, member);

		const events = await results.json();

		return events.map((e: EventObject) => new Event(e, this));
	}

	public async getNextRecurringEvent(): Promise<Maybe<Event>> {
		const results = await this.fetch(`/api/event/recurring`);

		const event = (await results.json()) as EitherObj<api.HTTPError, MaybeObj<EventObject>>;

		return either(event).cata(
			() => Promise.reject('Could not get event information'),
			ev => Promise.resolve(maybe(ev).map(e => new Event(e, this)))
		);
	}

	public async getUpcomingEvents(): Promise<Event[]> {
		const results = await this.fetch(`/api/event/upcoming`);

		const events = await results.json();

		if (isValidEither(events)) {
			throw new Error('Could not get event information');
		}

		return events.map((e: EventObject) => new Event(e, this));
	}

	public async getTeams(member?: MemberBase | null): Promise<Team[]> {
		const results = await this.fetch(`/api/team`, {}, member);

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

		const results = await this.fetch(`/api/files/${target}/children`, {}, member);

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

		const results = await this.fetch(`/api/files/${target}/children/dirty`, {}, member);

		const files = await results.json();

		return files.map((f: FullFileObject) => new FileInterface(f, this));
	}

	public toRaw(): AccountObject {
		return {
			adminIDs: this.adminIDs,
			mainCalendarID: this.mainCalendarID,
			wingCalendarID: this.wingCalendarID,
			serviceAccount: this.serviceAccount,
			shareLink: this.shareLink,
			comments: this.comments,
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

	public getEmbedLink(registry: Registry): string {
		return `<iframe src=\"https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
			this.mainCalendarID
		)}&ctz=America%2FNew_York\" style=\"border: 0\" width=\"720\" height=\"540\" frameborder=\"0\" scrolling=\"no\"></iframe>`;
	}
}
