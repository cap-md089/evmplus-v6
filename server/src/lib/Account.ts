import * as CAP from '../types';
// import Member from './Member';

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
}