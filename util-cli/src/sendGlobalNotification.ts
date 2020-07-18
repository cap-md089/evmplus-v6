#!/usr/bin/env node

import { getSession, Schema } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	AccountObject,
	Either,
	getFullMemberName,
	Maybe,
	NotificationCauseType,
	NotificationDataType,
	NotificationTargetType,
	RawServerConfiguration,
	toReference,
	Validator,
} from 'common-lib';
import {
	createNotification,
	generateResults,
	getAccount,
	resolveReference,
	saveNotification,
	confFromRaw,
} from 'server-common';
import { getCurrentGlobalNotification } from 'server-common/dist/notifications';

/**
 * This script is meant to be run from the command line, and provides a way
 * for administrators to globally notify everyone of something as a 'SYSTEM' message
 *
 * E.g., 'system is going down for maintenance'
 */

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

(async () => {
	const argError = () => {
		console.error('Please provide a source, account ID, expiration date, and message');
		console.error(
			'node sendGlobalNotification.js [CAPID|SYS] [Account ID|ALL] [YYYY-MM-DD] [HH:MM] [message...]'
		);
		process.exit(1);
	};

	// Simple check before going on further
	if (process.argv.length < 7) {
		argError();
	}

	const cliargs = process.argv.slice(2).join(' ');
	const check = cliargs.match(/^(\d{6}|SYS) (\S*) (\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) (.*)/);

	// Check if valid
	if (check === null) {
		argError();
		return;
	}

	/**
	 * Parse the results of user information, get targets, from, expiration and message
	 */
	const from =
		check[1].toLowerCase() === 'sys'
			? {
					type: NotificationCauseType.SYSTEM,
			  }
			: {
					type: NotificationCauseType.MEMBER,
					from: {
						id: parseInt(check[1], 10),
						type: 'CAPNHQMember' as const,
					},
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

	const alertAccount = async (account: AccountObject, db: Schema) => {
		try {
			// Allow overriding the accounts notification
			const saveMaybe = await getCurrentGlobalNotification(db)(account)
				.map(Maybe.map((notif) => ({ ...notif, read: true })))
				.map(Maybe.map(saveNotification(db)))
				.fullJoin();

			if (saveMaybe.hasValue) {
				await saveMaybe.value.fullJoin();
			}

			if (from.type === NotificationCauseType.SYSTEM) {
				// Create a system notification, doesn't require extra information
				await createNotification(db)(account)({
					cause: {
						type: NotificationCauseType.SYSTEM,
					},
					extraData: {
						type: NotificationDataType.MESSAGE,
						message,
					},
					target: {
						type: NotificationTargetType.EVERYONE,
						accountID: account.id,
						expires: expire,
					},
				}).fullJoin();
			} else {
				// Get the member sending the notification
				const member = await resolveReference(db)(account)(from.from!).fullJoin();

				await createNotification(db)(account)({
					cause: {
						type: NotificationCauseType.MEMBER,
						from: toReference(member),
						fromName: getFullMemberName(member),
					},
					extraData: {
						type: NotificationDataType.MESSAGE,
						message,
					},
					target: {
						type: NotificationTargetType.EVERYONE,
						accountID: account.id,
						expires: expire,
					},
				}).fullJoin();
			}
		} catch (e) {
			console.error(e);
		}
	};

	// Establish a connection
	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	const emSchema = session.getSchema(conf.DB_SCHEMA);

	if (accountID.toLowerCase() === 'all') {
		const accountsCollection = emSchema.getCollection<AccountObject>('Accounts');
		const accounts = generateResults(accountsCollection.find('true'));

		for await (const account of accounts) {
			await alertAccount(account, emSchema);
		}
	} else {
		const account = await getAccount(emSchema)(accountID).fullJoin();

		await alertAccount(account, emSchema);
	}

	await session.close();

	process.exit(0);
})();
