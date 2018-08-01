import * as express from 'express';
import * as moment from 'moment';
import * as mysql from 'promise-mysql';

import { Configuration } from '../conf';
import * as CAP from '../types';
import { MySQLRequest } from './MySQLUtil';

export interface AccountRequest extends MySQLRequest {
	account?: Account;
}

export default class Account implements CAP.AccountObject {
	public static ExpressMiddleware: express.RequestHandler = async (req: AccountRequest, res, next) => {
		const host = req.hostname;
		const parts = host.split('.');
		let accountID: string;

		if (parts[0] === 'www') {
			parts.shift();
		}

		if (
			parts.length === 1 &&
			Configuration.testing
		) {
			accountID = 'mdx89';
		} else if (parts.length === 2) {
			accountID = 'sales';
		} else if (parts.length === 3) {
			accountID = parts[0];
			if (accountID === 'capeventmanager') {
				accountID = 'mdx89';
			}
		} else if (parts.length === 4 && Configuration.testing) {
			accountID = 'mdx89';
		} else {
			res.status(400);
			res.end();
			return;
		}

		const account = await Account.Get(accountID, req.connectionPool);
		req.account = account;

		next();
	}

	public static async Get (id: string, pool: mysql.Pool): Promise<Account> {
		const results = await pool.query(
			`
				SELECT
					unitID, unitName, mainOrg, paid, echelon, expires, paidEventLimit, unpaidEventLimit
				FROM
					Accounts
				WHERE
					AccountID = ?
			`,
			[id]
		) as Array<{
			unitID: number,
			unitName: string,
			mainOrg: number,
			paid: number,
			echelon: number,
			expires: number,
			paidEventLimit: number,
			unpaidEventLimit: number
		}>;

		const parsed = results.map(result => ({
			echelon: result.echelon === 1,
			expires: result.expires,
			mainOrg: result.mainOrg,
			paid: result.paid === 1,
			paidEventLimit: result.paidEventLimit,
			unitID: result.unitID,
			unitName: result.unitName,
			unpaidEventLimit: result.unpaidEventLimit
		}));

		if (parsed.length === 0) {
			throw new Error(`Account '${id}' not found`);
		}

		const orgIDs = parsed.map(org => org.unitID);
		const orgSQL = '(' + orgIDs.join(', ') + ')';

		const paid = parsed.map(org => org.paid).reduce((prev, current) => prev || current);
		const paidEventLimit = parsed.map(org => org.paidEventLimit).reduce((prev, current) => Math.max(prev, current));
		const unpaidEventLimit = parsed.map(org => org.unpaidEventLimit).reduce((prev, current) => Math.max(prev, current));

		const expires = parsed.map(org => org.expires).reduce((prev, current) => Math.max(prev, current));
		const expired = moment().utc().valueOf() > expires;
		const expiresIn = moment().utc().valueOf() - expires;

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

		return new this ({
			adminIDs: [],
			expired,
			expiresIn,
			id,
			orgIDs,
			orgSQL,
			paid,
			paidEventLimit,
			unpaidEventLimit,
			validPaid: !expired && paid
		});
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
	public expiresIn: number;
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

	

	private constructor (data: CAP.AccountObject) {
		// tslint:disable-next-line:no-any
		Object.assign(this, data);
	}

	public buildURI (...identifiers: string[]) {
		let uri = Configuration.testing ? `/` : `https://${this.id}.capunit.com/`;

		for (const i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}
}