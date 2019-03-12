#!/usr/bin/env node

import { getSession, Schema } from '@mysql/xdevapi';
import { NotificationCause, RawAccountObject } from 'common-lib';
import { NotificationCauseType } from 'common-lib/index';
import conf from './conf';
import Account from './lib/Account';
import MemberBase from './lib/Members';
import { collectResults } from './lib/MySQLUtil';
import GlobalNotification from './lib/notifications/GlobalNotification';

/**
 * This script is meant to be run from the command line, and provides a way
 * for administrators to globally notify everyone of something as a 'SYSTEM' message
 */

const argError = () => {
	console.error('Please provide a source, account ID, expiration date, and message');
	console.error(
		'node sendGlobalNotification.js [CAPID|SYS] [Account ID|ALL] [YYYY-MM-DD] [HH:MM] [message...]'
	);
	process.exit(1);
}

// Simple check before going on further
if (process.argv.length < 7) {
	argError();
}

const cliargs = process.argv.slice(2).join(' ');
const check = cliargs.match(/^(\d{6}|SYS) (\S*) (\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) (.*)/);

// Check if valid
if (check === null) {
	argError();
}

/**
 * Parse the results of user information, get targets, from, expiration and message
 */
const from: NotificationCause =
	check[1].toLowerCase() === 'sys'
		? {
				type: NotificationCauseType.SYSTEM
		  }
		: {
				type: NotificationCauseType.MEMBER,
				from: {
					id: parseInt(check[1], 10),
					type: 'CAPNHQMember'
				}
		  };
const accountID = check[2];
const expire = new Date(
	parseInt(check[3], 10), // Year
	parseInt(check[4], 10) - 1, // Month 'index'
	parseInt(check[5], 10), // Day
	parseInt(check[6], 10), // Hour
	parseInt(check[7], 10) // Minute
).getTime();
const message = check[8];

const alertAccount = async (account: Account, schema: Schema) => {
	try {
		// Allow overriding the accounts notification
		try {
			const current = await GlobalNotification.GetCurrent(account, schema);
			current.markAsRead();
			await current.save();
		} catch(e) {
			// There is not currently an active notification
		}

		if (from.type === NotificationCauseType.SYSTEM) {
			// Create a system notification, doesn't require extra information
			try {
				await GlobalNotification.CreateNotification(
					message,
					expire,
					from,
					account,
					schema
				);
			} catch (e) {
				console.error('Unknown error:');
				console.error(e);
			}
		} else {
			try {
				// Get the member sending the notification
				const member = await MemberBase.ResolveReference(from.from, account, schema);

				// 
				try {
					await GlobalNotification.CreateNotification(
						message,
						expire,
						from,
						account,
						schema,
						member
					);
				} catch (e) {
					console.error('Unknown error:');
					console.error(e);
				}
			} catch (e) {
				console.error('Invalid member ' + parseInt(check[1], 10));
			}
		}
	} catch (e) {
		console.error(e);
	}
}

(async config => {
	// Establish a connection
	const { database: schema, host, password, port: mysqlPort, user } = config.database.connection;

	const session = await getSession({
		host,
		password,
		port: mysqlPort,
		user
	});

	const emSchema = session.getSchema(schema);

	if (accountID.toLowerCase() === 'all') {
		const accountsCollection = emSchema.getCollection<RawAccountObject>('Accounts');
		const accounts = await collectResults(accountsCollection.find('true'));

		for (const account of accounts) {
			const fullAccount = await Account.Get(account.id, emSchema);

			await alertAccount(fullAccount, emSchema);
		}

		process.exit(0);
	} else {
		const account = await Account.Get(accountID, emSchema);

		await alertAccount(account, emSchema);

		process.exit(0);
	}
})(conf);
