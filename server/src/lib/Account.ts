import * as mysql from '@mysql/xdevapi';
import { AccountObject, api, AsyncEither, asyncLeft, asyncRight, DatabaseInterface, EventObject, FileObject, just, left, MemberReference, NHQ, none, NoSQLDocument, ProspectiveMemberObject, RawAccountObject, RawTeamObject, right } from 'common-lib';
import * as express from 'express';
import { DateTime } from 'luxon';
import { areMemberReferencesTheSame, asyncErrorHandler, CAPMemberClasses, CAPNHQMember, CAPProspectiveMember, Event, File, findAndBind, generateResults, isValidMemberReference, MonthNumber, MySQLRequest, ParamType, Registry, Team } from './internals';
import { ConditionalMemberRequest } from './member/pam/Session';
import { BasicMySQLRequest, safeBind } from './MySQLUtil';
import saveServerError from './saveServerError';
import { serverErrorGenerator } from './Util';

export interface AccountRequest<P extends ParamType = {}, B = any> extends MySQLRequest<P, B> {
	account: Account;
}

export interface BasicAccountRequest<P extends ParamType = {}, B = any>
	extends BasicMySQLRequest<P, B> {
	account: Account;
}

export default class Account implements AccountObject, DatabaseInterface<AccountObject> {
	public static ExpressMiddleware = asyncErrorHandler(
		async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
			const host = req.hostname;
			const parts = host.split('.');
			let accountID: string;

			if (parts[0] === 'www') {
				parts.shift();
			}

			if (parts.length === 1 && process.env.NODE_ENV !== 'production') {
				accountID = 'mdx89';
			} else if (parts.length === 2) {
				accountID = 'sales';
			} else if (parts.length === 3) {
				accountID = parts[0];
			} else if (parts.length === 4 && process.env.NODE_ENV !== 'production') {
				accountID = 'mdx89';
			} else {
				res.status(400);
				res.end();
				return;
			}

			try {
				const account = await Account.Get(accountID, req.mysqlx);
				req.account = account;
			} catch (e) {
				if (e.message && e.message.startsWith('Unknown account: ')) {
					res.status(400);
				} else {
					res.status(500);
				}
				res.end();
				return;
			}

			next();
		}
	);

	public static LeftyExpressMiddleware = asyncErrorHandler(
		async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
			const host = req.hostname;
			const parts = host.split('.');
			let accountID: string;

			if (parts[0] === 'www') {
				parts.shift();
			}

			if (parts.length === 1 && process.env.NODE_ENV !== 'production') {
				accountID = 'mdx89';
			} else if (parts.length === 2) {
				accountID = 'sales';
			} else if (parts.length === 3) {
				accountID = parts[0];
			} else if (parts.length === 4 && process.env.NODE_ENV !== 'production') {
				accountID = 'mdx89';
			} else {
				res.status(400);
				return res.json(
					left({
						code: 400,
						message: 'Could not get account ID from URL'
					})
				);
			}

			try {
				const account = await Account.Get(accountID, req.mysqlx);
				req.account = account;
			} catch (e) {
				if (e.message && e.message.startsWith('Unknown account: ')) {
					res.status(400);
					return res.json(
						left({
							code: 400,
							message: 'Could not get account with ID ' + accountID
						})
					);
				} else {
					await saveServerError(e, req as ConditionalMemberRequest);
					res.status(500);
					return res.json(
						left({
							code: 500,
							message: 'Unknown server error'
						})
					);
				}
			}

			next();
		}
	);

	public static RequestTransformer = <T extends BasicMySQLRequest>(
		req: T
	): AsyncEither<api.ServerError, T & BasicAccountRequest> =>
		asyncRight(
			req.hostname.split('.'),
			serverErrorGenerator('Could not get organization account information')
		)
			.flatMap<string>(parts => {
				while (parts[0] === 'www') {
					parts.shift();
				}

				if (parts.length === 1 && process.env.NODE_ENV !== 'production') {
					// localhost
					return right('mdx89');
				} else if (parts.length === 2) {
					// capunit.com
					return right('sales');
				} else if (parts.length === 3 && parts[0] === 'www') {
					// www.capunit.com
					return right('sales');
				} else if (parts.length === 3) {
					// md089.capunit.com
					return right(parts[0]);
				} else if (parts.length === 4 && process.env.NODE_ENV !== 'production') {
					// 192.168.1.128
					return right('mdx89');
				} else {
					// IP/localhost in production, otherwise invalid hostname
					return asyncLeft({
						code: 400,
						error: none<Error>(),
						message: 'Could not get account ID from URL'
					});
				}
			})
			.map(
				id => Account.Get(id, req.mysqlx),
				err => {
					if (err.message && err.message.startsWith('Unknown account: ')) {
						return {
							code: 400,
							error: none<Error>(),
							message: err.message
						};
					} else {
						return {
							code: 500,
							error: just(err),
							message: 'Unknown server error'
						};
					}
				}
			)
			.map(account => ({ ...req, account }));

	public static PayWall = (
		req: AccountRequest,
		res: express.Response,
		next: express.NextFunction
	) => {
		if (!req.account) {
			res.status(400);
			res.end();
			return;
		}

		if (!req.account.validPaid) {
			res.status(402);
			res.end();
			return;
		}

		next();
	};

	public static async Get(id: string, schema: mysql.Schema): Promise<Account> {
		const accountCollection = schema.getCollection<RawAccountObject & Required<NoSQLDocument>>(
			'Accounts'
		);

		let result = null;
		for await (const account of generateResults(accountCollection.find('true'))) {
			if (account.id === id || account.aliases.includes(id)) {
				if (result !== null) {
					throw new Error('Unknown account: ' + id);
				}

				result = account;
			}
		}

		if (result === null) {
			throw new Error('Unknown account: ' + id);
		}

		const expired = +DateTime.utc() > result.expires;
		const validPaid = !expired && result.paid;

		return new this(
			{
				...result,
				validPaid,
				expired
			},
			schema
		);
	}

	public static async Create(values: RawAccountObject, schema: mysql.Schema) {
		try {
			await Account.Get(values.id, schema);

			throw new Error('Cannot create duplicate account');
		} catch (e) {
			// Do nothing. An error is good
		}

		const accountCollection = schema.getCollection<RawAccountObject>('Accounts');

		const newValues: RawAccountObject = {
			adminIDs: values.adminIDs,
			mainCalendarID: values.mainCalendarID,
			wingCalendarID: values.wingCalendarID,
			serviceAccount: values.serviceAccount,
			shareLink: values.shareLink,
			embedLink: values.embedLink,
			initialPassword: values.initialPassword,
			comments: values.comments,
			echelon: values.echelon,
			expires: values.expires,
			id: values.id,
			mainOrg: values.mainOrg,
			orgIDs: values.orgIDs,
			paid: values.paid,
			paidEventLimit: values.paidEventLimit,
			unpaidEventLimit: values.unpaidEventLimit,
			aliases: values.aliases
		};

		const expired = +DateTime.utc() > values.expires;
		const validPaid = !expired && newValues.paid;

		// tslint:disable-next-line:variable-name
		const _id = (await accountCollection.add(newValues).execute()).getGeneratedIds()[0];

		return new this(
			{
				...newValues,
				expired,
				validPaid,
				_id
			},
			schema
		);
	}

	/**
	 * The Account ID
	 */
	public id: string;
	/**
	 * The ids of the organizations
	 */
	public orgIDs: number[];
	/**
	 * Whether the account is a paid account
	 */
	public paid: boolean;
	/**
	 * Whether the accoutn is a valid paid account
	 */
	public validPaid: boolean;
	/**
	 * Whether the account is expired
	 */
	public expired: boolean;
	/**
	 * When the account expires in (seconds)
	 */
	public expires: number;
	/**
	 * How many events can be used if this account is paid for
	 */
	public paidEventLimit: number;
	/**
	 * How many events can be used if this account is unpaid for
	 */
	public unpaidEventLimit: number;
	/**
	 * CAP IDs of the admins of this account
	 */
	public adminIDs: MemberReference[];
	/**
	 * The web link used to share the Google Calendar to Wing or others 
	 * (only contains events with the publishToWingCalendar property true)
	 */
	public shareLink: string;
	/**
	 * The link used to embed the squadron calendar in web pages like
	 * SiteViz or others
	 */
	public embedLink: string;
	/**
	 * Initial password used to generate Google account for a unit
	 */
	public initialPassword: string;
	/**
	 * Miscellaneous comments regarding the account
	 */
	public comments: string;
	/**
	 * Whether or not this account is an echelon account
	 */
	public echelon: boolean;
	/**
	 * The main organization for this account
	 */
	public mainOrg: number;
	/**
	 * The different account IDs that can reference this one
	 */
	public aliases: string[];
	/**
	 * The ID of the main Google calendar
	 */
	public mainCalendarID: string;
	/**
	 * The ID of the wing Google calendar
	 */
	public wingCalendarID: string;
	/**
	 * The email address of the Google service account.  Not directly used by
	 * CAPUnit.com, however it is good to have for configuration.
	 */
	public serviceAccount: string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private constructor(
		data: AccountObject & Required<NoSQLDocument>,
		private schema: mysql.Schema
	) {
		this._id = data._id;
		this.mainOrg = data.mainOrg;
		this.adminIDs = data.adminIDs;
		this.unpaidEventLimit = data.unpaidEventLimit;
		this.echelon = data.echelon;
		this.shareLink = data.shareLink,
		this.embedLink = data.embedLink,
		this.initialPassword = data.initialPassword,
		this.comments = data.comments,
		this.paidEventLimit = data.paidEventLimit;
		this.paid = data.paid;
		this.expired = data.expired;
		this.expires = data.expires;
		this.validPaid = data.validPaid;
		this.orgIDs = data.orgIDs;
		this.id = data.id;
		this.aliases = data.aliases;
		this.mainCalendarID = data.mainCalendarID;
		this.wingCalendarID = data.wingCalendarID;
		this.serviceAccount = data.serviceAccount;
	}

	public buildURI(...identifiers: string[]) {
		let uri = process.env.NODE_ENV !== 'production' ? `/` : `https://${this.id}.capunit.com/`;

		for (const i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}

	public async *getMembers(): AsyncIterableIterator<CAPMemberClasses> {
		const memberCollection = this.schema.getCollection<NHQ.CAPMember>('NHQ_Member');

		for (const ORGID of this.orgIDs) {
			const memberFind = findAndBind(memberCollection, {
				ORGID
			});

			for await (const member of generateResults(memberFind)) {
				yield CAPNHQMember.Get(member.CAPID, this, this.schema);
			}
		}

		const prospectiveMemberCollection = this.schema.getCollection<ProspectiveMemberObject>(
			'ProspectiveMembers'
		);

		const prospectiveMemberFind = findAndBind(prospectiveMemberCollection, {
			accountID: this.id
		});

		for await (const member of generateResults(prospectiveMemberFind)) {
			yield CAPProspectiveMember.Get(member.id, this, this.schema);
		}
	}

	public async *getFiles(includeWWW = true): AsyncIterableIterator<File> {
		const fileCollection = this.schema.getCollection<FileObject>('Files');

		let fileFind;

		if (includeWWW) {
			fileFind = safeBind(
				fileCollection.find('accountID = :accountID OR accountID = "www"'),
				{ accountID: this.id }
			);
		} else {
			fileFind = findAndBind(fileCollection, {
				accountID: this.id
			});
		}

		for await (const file of generateResults(fileFind)) {
			yield File.Get(file.id, this, this.schema);
		}
	}

	public async *getEvents(): AsyncIterableIterator<Event> {
		const eventCollection = this.schema.getCollection<EventObject>('Events');

		const eventIterator = findAndBind(eventCollection, {
			accountID: this.id
		});

		for await (const event of generateResults(eventIterator)) {
			yield Event.Get(event.id, this, this.schema);
		}
	}

	public async *getSortedEvents(): AsyncIterableIterator<Event> {
		const eventCollection = this.schema.getCollection<EventObject>('Events');

		const eventIterator = findAndBind(eventCollection, {
			accountID: this.id
		}).sort('pickupDateTime ASC');

		for await (const event of generateResults(eventIterator)) {
			yield Event.Get(event.id, this, this.schema);
		}
	}

	public async *getTeams(): AsyncIterableIterator<Team> {
		const teamsCollection = this.schema.getCollection<RawTeamObject>('Teams');

		// This needs to be included to include the staff team, which does not directly
		// exist in the database and is more dynamic
		yield Team.Get(0, this, this.schema);

		const teamIterator = findAndBind(teamsCollection, {
			accountID: this.id
		});

		for await (const team of generateResults(teamIterator)) {
			yield Team.Get(team.id, this, this.schema);
		}
	}

	public async *getTeamObjects(): AsyncIterableIterator<RawTeamObject> {
		const teamsCollection = this.schema.getCollection<RawTeamObject>('Teams');

		// This needs to be included to include the staff team, which does not directly
		// exist in the database and is more dynamic
		yield await Team.GetRawStaffTeam(this, this.schema);

		const teamIterator = findAndBind(teamsCollection, {
			accountID: this.id
		});

		for await (const team of generateResults(teamIterator)) {
			yield team;
		}
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<AccountObject>): boolean {
		if (typeof values.echelon === 'boolean') {
			this.echelon = values.echelon;
		}

		if (typeof values.expires === 'number') {
			this.expires = values.expires;
		}

		if (typeof values.paidEventLimit === 'number') {
			this.paidEventLimit = values.paidEventLimit;
		}

		if (typeof values.unpaidEventLimit === 'number') {
			this.unpaidEventLimit = values.unpaidEventLimit;
		}

		if (Array.isArray(values.adminIDs)) {
			if (values.adminIDs.every(isValidMemberReference)) {
				this.adminIDs = values.adminIDs.slice(0);
			}
		}

		if (Array.isArray(values.orgIDs)) {
			if (values.orgIDs.every(num => typeof num === 'number')) {
				this.orgIDs = values.orgIDs.slice(0);
			}
		}

		if (typeof values.paid === 'boolean') {
			this.paid = values.paid;
		}

		return true;
	}

	public async save(): Promise<void> {
		const accountCollection = this.schema.getCollection<RawAccountObject>('Accounts');

		await accountCollection.replaceOne(this._id, {
			adminIDs: this.adminIDs,
			mainCalendarID: this.mainCalendarID,
			wingCalendarID: this.wingCalendarID,
			serviceAccount: this.serviceAccount,
			shareLink: this.shareLink,
			embedLink: this.embedLink,
			initialPassword: this.initialPassword,
			comments: this.comments,
			echelon: this.echelon,
			expires: this.expires,
			id: this.id,
			mainOrg: this.mainOrg,
			orgIDs: this.orgIDs,
			paid: this.paid,
			paidEventLimit: this.paidEventLimit,
			unpaidEventLimit: this.unpaidEventLimit,
			aliases: this.aliases
		});
	}

	public toRaw = (): AccountObject => ({
		adminIDs: this.adminIDs,
		mainCalendarID: this.mainCalendarID,
		wingCalendarID: this.wingCalendarID,
		serviceAccount: this.serviceAccount,
		shareLink: this.shareLink,
		embedLink: this.embedLink,
		initialPassword: this.initialPassword,
		comments: this.comments,
		echelon: this.echelon,
		expired: this.expired,
		expires: this.expires,
		id: this.id,
		mainOrg: this.mainOrg,
		orgIDs: this.orgIDs,
		paid: this.paid,
		paidEventLimit: this.paidEventLimit,
		unpaidEventLimit: this.unpaidEventLimit,
		validPaid: this.validPaid,
		aliases: this.aliases
	});

	public getSquadronName(): string {
		return this.id.replace(/([a-zA-Z]*)([0-9]*)/, '$1-$2').toUpperCase();
	}

	public async getEventCountForMonth(month: MonthNumber, year: number) {
		const start = new Date(year, month).getTime();
		const end = new Date(year, month + 1).getTime();

		const eventCollection = this.schema.getCollection('Events');

		const generator = generateResults(
			safeBind(
				eventCollection.find(
					'(pickupDateTime > :start AND pickupDateTime < :end) OR (meetDateTime < :end && meetDateTime > :start)'
				),
				{
					start,
					end
				}
			)
		);

		let eventCount = 0;

		for await (const _ of generator) {
			eventCount++;
		}

		return eventCount;
	}

	public isAdmin(member: MemberReference) {
		for (const i of this.adminIDs) {
			if (areMemberReferencesTheSame(member, i)) {
				return true;
			}
		}

		return false;
	}

	public getRegistry() {
		return Registry.Get(this, this.schema);
	}
}
