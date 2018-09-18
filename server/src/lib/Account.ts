import * as mysql from '@mysql/xdevapi';
import * as express from 'express';
import { DateTime } from 'luxon';
import File from './File';
import CAPWATCHMember from './members/CAPWATCHMember';
import {
	collectResults,
	findAndBind,
	generateResults,
	MySQLRequest
} from './MySQLUtil';
import Event from './Event';

export interface AccountRequest extends MySQLRequest {
	account: Account;
}

export default class Account
	implements AccountObject, DatabaseInterface<AccountObject> {
	public static ExpressMiddleware: express.RequestHandler = async (
		req: AccountRequest,
		res,
		next
	) => {
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
			if (accountID === 'capeventmanager') {
				accountID = 'mdx89';
			}
		} else if (
			parts.length === 4 &&
			process.env.NODE_ENV !== 'production'
		) {
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
			if (e.message.startsWith('Unkown account: ')) {
				res.status(400);
			} else {
				res.status(500);
			}
			res.end();
			return;
		}

		next();
	};

	public static async Get(
		id: string,
		schema: mysql.Schema
	): Promise<Account> {
		const accountCollection = schema.getCollection<AccountObject>(
			'Accounts'
		);

		const results = await collectResults(
			findAndBind(accountCollection, {
				id
			})
		);

		if (results.length !== 1) {
			throw new Error('Unkown account: ' + id);
		}

		const result = results[0];

		const expires = result.expires;
		const expired = +DateTime.utc() > expires;

		// let adminIDs: number[] = (await pool.query(
		// 	`
		// 		SELECT
		// 			id
		// 		FROM
		// 			UserAccessLevels
		// 		WHERE
		// 			AccountID = ?
		// 	`,
		// 	[id]
		// )).map((result: {id: number}) => result.id);

		return new this(
			{
				...result,
				validPaid: !expired && result.paid,
				expired
			},
			schema
		);
	}

	/**
	 * The Account ID
	 */
	public id: string;
	/**
	 * The SQL used to select all organizations that are in the account
	 */
	public orgSQL: string;
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
	public adminIDs: number[];
	/**
	 * Whether or not this account is an echelon account
	 */
	public echelon: boolean;
	/**
	 * The main organization for this account
	 */
	public mainOrg: number;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private constructor(data: AccountObject, private schema: mysql.Schema) {
		Object.assign(this, data);
	}

	public buildURI(...identifiers: string[]) {
		let uri =
			process.env.NODE_ENV !== 'production'
				? `/`
				: `https://${this.id}.capunit.com/`;

		for (const i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}

	public async *getMembers(): AsyncIterableIterator<CAPWATCHMember> {
		const memberCollection = this.schema.getCollection<NHQ.Member>(
			'NHQ_Member'
		);

		for (const ORGID of this.orgIDs) {
			const memberFind = findAndBind(memberCollection, {
				ORGID
			});

			for await (const member of generateResults(memberFind)) {
				yield CAPWATCHMember.Get(member.CAPID, this, this.schema);
			}
		}
	}

	public async *getFiles(includeWWW = true): AsyncIterableIterator<File> {
		const fileCollection = this.schema.getCollection<FileObject>('Files');

		let fileFind;

		if (includeWWW) {
			fileFind = fileCollection
				.find('accountID = :accountID OR accountID = "www"')
				.bind({ accountID: this.id });
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

	public toRaw = (): AccountObject => ({
		adminIDs: this.adminIDs,
		echelon: this.echelon,
		expired: this.expired,
		expires: this.expires,
		id: this.id,
		mainOrg: this.mainOrg,
		orgIDs: this.orgIDs,
		paid: this.paid,
		paidEventLimit: this.paidEventLimit,
		unpaidEventLimit: this.unpaidEventLimit,
		validPaid: this.validPaid
	});
}
