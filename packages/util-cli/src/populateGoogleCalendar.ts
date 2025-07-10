#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { 
	AccountObject,
	Either,
	EventObject, 
	PopulateGoogleCalendarErrors,
} from 'common-lib';
import { createInterface } from 'readline';
import { conf, generateResults, createGoogleCalendarEvents, deleteAllGoogleCalendarEvents, modifyAndBind } from 'server-common';
import { backendGenerator } from './lib/backend';

export interface populateGoogleCalendarResult {
	type: 'Result';
	error: PopulateGoogleCalendarErrors;
}

process.on('unhandledRejection', populateGCError => {
	throw populateGCError;
});

const askQuestion = (rl: ReturnType<typeof createInterface>) => (
	question: string,
): Promise<string> =>
	new Promise<string>(res => {
		rl.question(question, res);
	});

void (async () => {
	const config = await conf.getCLIConfiguration();

	const readlineInterface = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const asker = askQuestion(readlineInterface);

	let accountid = null;
	while (!accountid) {
		if (accountid !== null) {
			console.log('ID cannot be blank');
		}
		accountid = await asker('What is the ID of the account to populate? (ie: md001) - ');
	}

	if (accountid === '') {
		console.log('No account ID provided, exiting');
		return;
	}

	let newCalendarID = await asker('What is the Google calendar ID? - ');

	if (newCalendarID === '') {
		console.log('No calendar ID provided, exiting');
		return;
	}

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	await session
		.getSchema(config.DB_SCHEMA)
		.getCollection<EventObject>('Events');

	const backend = backendGenerator(config)(session.getSchema(config.DB_SCHEMA));

	const accountEither = await backend.getAccount(accountid);

	if (Either.isLeft(accountEither)) {
		// throw error
		console.log(`Failed to load account ${accountid}: ${accountEither.value}`);
		return;
	}

	const account = accountEither.value;

	const events = backend.queryEvents('true')(account)({});

	// clear new calendar
	try{
		console.log(`Deleting all Google Calendar events for account ${accountid}`);
		await deleteAllGoogleCalendarEvents(account, config, newCalendarID);
	} catch(error) {
		console.error(`Failed to delete Google Calendar events for account ${accountid}:`, error);
	}

	const table = backend.getCollection('Events');

    for await (const event of generateResults(events)) {
        // Process each event 
		const fullEventEither = await backend.ensureResolvedEvent(event);

		if (Either.isLeft(fullEventEither)) {
			console.log(`Failed to load event ${event.id}: ${fullEventEither.value}`);
			continue;
		}
		try {
			console.log(`Creating Google Calendar events for event ${event.id}`);
        	const [mainId, regId, feeId] = await createGoogleCalendarEvents(backend, fullEventEither.value, account, config, newCalendarID);

			await modifyAndBind(table, { id: event.id }).patch({ googleCalendarIds: { mainId, feeId, regId } }).execute();
		} catch(error) {
			console.error(`Failed to create Google Calendar events for event ${event.id}:`);
			continue;
		}
    }

	console.log(`Finished processing events for account ${accountid}`);

	await session
		.getSchema(config.DB_SCHEMA)
		.getCollection<AccountObject>('Accounts')
		.modify('id = :id')
		.bind('id', account.id)
		.patch({mainCalendarID: newCalendarID})
		.execute();

	await session.close();

	readlineInterface.close();

	process.exit();
})();
