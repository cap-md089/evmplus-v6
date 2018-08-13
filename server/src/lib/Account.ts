import * as mysql from '@mysql/xdevapi';
import * as express from 'express';
import { DateTime } from 'luxon';
import { Configuration } from '../conf';
import { collectResults, findAndBind, MySQLRequest } from './MySQLUtil';

export interface AccountRequest extends MySQLRequest {
	account: Account | null;
}

export default class Account implements AccountObject {
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
			res.status(500);
			res.end();
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
		let uri = process.env.NODE_ENV !== 'production'
			? `/`
			: `https://${this.id}.capunit.com/`;

		for (const i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}
}
