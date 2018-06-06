import * as express from 'express';
import * as mysql from 'promise-mysql';
import * as moment from 'moment';

import * as CAP from '../types';
import { Configuration } from '../conf';
import { MySQLRequest } from './MySQLUtil';

export interface AccountRequest extends MySQLRequest {
	account?: Account;
}

export default class Account implements CAP.AccountObject {
	/**
	 * The Account ID
	 */
	id: string;
	/**
	 * The SQL used to select all organizations that are in the account
	 */
	orgSQL: string;
	/**
	 * The ids of the organizations
	 */
	orgIDs: number[];
	/**
	 * Whether the account is a paid account
	 */
	paid: boolean;
	/**
	 * Whether the accoutn is a valid paid account
	 */
	validPaid: boolean;
	/**
	 * Whether the account is expired
	 */
	expired: boolean;
	/**
	 * When the account expires in (seconds)
	 */
	expiresIn: number;
	/**
	 * How many events can be used if this account is paid for
	 */
	paidEventLimit: number;
	/**
	 * How many events can be used if this account is unpaid for
	 */
	unpaidEventLimit: number;
	/**
	 * CAP IDs of the admins of this account
	 */
	adminIDs: number[];

	public static ExpressMiddleware: express.RequestHandler = async (req: MySQLRequest & AccountRequest, res, next) => {
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

		let account = await Account.Get(accountID, req.connectionPool);
		req.account = account;

		next();
	}

	public static async Get (id: string, pool: mysql.Pool): Promise<Account> {
		let results = await pool.query(
			`
				SELECT
					unitID, unitName, mainOrg, paid, echelon, expires, paidEventLimit, unpaidEventLimit
				FROM
					Accounts
				WHERE
					AccountID = ?
			`,
			[id]
		) as {
			unitID: number,
			unitName: string,
			mainOrg: number,
			paid: number,
			echelon: number,
			expires: number,
			paidEventLimit: number,
			unpaidEventLimit: number
		}[];

		let parsed = results.map(result => ({
			unitID: result.unitID,
			unitName: result.unitName,
			mainOrg: result.mainOrg,
			paid: result.paid === 1,
			echelon: result.echelon === 1,
			expires: result.expires,
			paidEventLimit: result.paidEventLimit,
			unpaidEventLimit: result.unpaidEventLimit
		}));

		if (parsed.length === 0) {
			throw new Error(`Account '${id}' not found`);
		}

		let orgIDs = parsed.map(org => org.unitID);
		let orgSQL = '(' + orgIDs.join(', ') + ')';

		let paid = parsed.map(org => org.paid).reduce((prev, current) => prev || current);
		let paidEventLimit = parsed.map(org => org.paidEventLimit).reduce((prev, current) => Math.max(prev, current));
		let unpaidEventLimit = parsed.map(org => org.unpaidEventLimit).reduce((prev, current) => Math.max(prev, current));

		let expires = parsed.map(org => org.expires).reduce((prev, current) => Math.max(prev, current));
		let expired = moment().utc().valueOf() > expires;
		let expiresIn = moment().utc().valueOf() - expires;

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
			id,
			orgSQL,
			orgIDs,
			paid,
			expired,
			validPaid: !expired && paid,
			expiresIn,
			paidEventLimit,
			unpaidEventLimit,
			adminIDs: []
		});
	}

	private constructor (data: CAP.AccountObject) {
		// tslint:disable-next-line:no-any
		(<any> Object).assign(this, data);
	}

	public buildURI (...identifiers: string[]) {
		let uri = Configuration.testing ? `/` : `https://${this.id}.capunit.com/`;

		for (let i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}
}