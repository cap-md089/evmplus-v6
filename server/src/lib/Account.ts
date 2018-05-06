import * as CAP from '../types';
// import Member from './Member';
import * as express from 'express';
import { Configuration } from '../conf';

export interface AccountRequest extends express.Request {
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

	public static ExpressMiddleware: express.RequestHandler = (req: AccountRequest, res, next) => {
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
		} else {
			res.status(400);
			res.end();
			return;
		}

		Account.Get(accountID).then(account => {
			req.account = account;
			next();
		});
	}

	public static Get (id: string): Promise<Account> {
		return new Promise ((res: (value?: Account) => void, rej: () => void) => {
			res(new this ({
				id,
				orgSQL: '(0)',
				orgIDs: [],
				paid: false,
				validPaid: false,
				expired: false,
				expiresIn: 0,
				paidEventLimit: 500,
				unpaidEventLimit: 5,
				adminIDs: []
			}));
		});
	}

	private constructor (data: CAP.AccountObject) {
		// tslint:disable-next-line:no-any
		(<any> Object).assign(this, data);
	}
}