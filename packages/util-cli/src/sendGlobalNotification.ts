#!/usr/bin/env node
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	getFullMemberName,
	Maybe,
	NotificationCause,
	NotificationCauseType,
	NotificationDataType,
	NotificationTargetType,
	toReference,
} from 'common-lib';
import {
	conf,
	createNotification,
	generateResults,
	getCurrentGlobalNotification,
	saveNotification,
} from 'server-common';
import { backendGenerator } from './lib/backend';

/**
 * This script is meant to be run from the command line, and provides a way
 * for administrators to globally notify everyone of something as a 'SYSTEM' message
 *
 * E.g., 'system is going down for maintenance'
 */

void (async () => {
	const config = await conf.getCLIConfiguration();

	const argError = (): never => {
		console.error('Please provide a source, account ID, expiration date, and message');
		console.error(
			'node sendGlobalNotification.js [CAPID|SYS] [Account ID|ALL] [YYYY-MM-DD] [HH:MM] [message...]',
		);
		process.exit(1);
	};

	// Simple check before going on further
	if (process.argv.length < 7) {
		argError();
	}

	const cliargs = process.argv.slice(2).join(' ');
	const check = /^(\d{6}|SYS) (\S*) (\d{4})-(\d{2})-(\d{2}) (\d{2}):?(\d{2}) (.*)/.exec(cliargs);

	// Check if valid
	if (check === null) {
		argError();
		return;
	}

	/**
	 * Parse the results of user information, get targets, from, expiration and message
	 */
	const from: NotificationCause =
		check[1].toLowerCase() === 'sys'
			? {
					type: NotificationCauseType.SYSTEM as const,
			  }
			: {
					type: NotificationCauseType.MEMBER as const,
					from: {
						id: parseInt(check[1], 10),
						type: 'CAPNHQMember' as const,
					},
					fromName: '',
			  };
	const accountID = check[2];
	const expire = new Date(
		parseInt(check[3], 10), // Year
		parseInt(check[4], 10) - 1, // Month 'index'
		parseInt(check[5], 10), // Day
		parseInt(check[6], 10), // Hour
		parseInt(check[7], 10), // Minute
	).getTime();
	const message = check[8];

	// Establish a connection
	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	const emSchema = session.getSchema(config.DB_SCHEMA);

	const backend = backendGenerator(emSchema);

	const alertAccount = async (account: AccountObject, db: Schema): Promise<void> => {
		try {
			// Allow overriding the accounts notification
			const saveMaybe = await getCurrentGlobalNotification(db)(account)
				.map(Maybe.map(notif => ({ ...notif, read: true })))
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
				const member = await backend.getMember(account)(from.from).fullJoin();

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

	if (accountID.toLowerCase() === 'all') {
		const accountsCollection = emSchema.getCollection<AccountObject>('Accounts');
		const accounts = generateResults(accountsCollection.find('true'));

		for await (const account of accounts) {
			await alertAccount(account, emSchema);
		}
	} else {
		const account = await backend.getAccount(accountID).fullJoin();

		await alertAccount(account, emSchema);
	}

	await session.close();

	process.exit(0);
})();
