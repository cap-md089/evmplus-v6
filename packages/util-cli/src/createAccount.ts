#!/usr/local/bin/node --no-warnings
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

import { getSession } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	DiscordServerInformation,
	getDefaultAdminPermissions,
	Maybe,
	MaybeObj,
	MemberReference,
	RawCAPSquadronAccountObject,
	RegistryValues,
} from 'common-lib';
import { createInterface } from 'readline';
import { conf, createGoogleCalendar } from 'server-common';
import { backendGenerator } from './lib/backend';

process.on('unhandledRejection', up => {
	throw up;
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

	let id = null;
	while (!id) {
		if (id !== null) {
			console.log('ID cannot be blank');
		}
		id = await asker('What will be the ID of the new account? (ie: md001) - ');
	}

	let name = null;
	while (!name) {
		if (name !== null) {
			console.log('Website name cannot be blank');
		}
		name = await asker(
			'What is the name of the new account? (ie: John Smith Composite Squadron) - ',
		);
	}

	const serverID = await asker(
		'Is there a Discord server associated with this unit (optional) ? - ',
	);
	const discordServer: MaybeObj<DiscordServerInformation> =
		serverID === ''
			? Maybe.none()
			: Maybe.some({
					serverID,
					displayFlight: true,
					staffChannel: null,
			  });

	let mainCalendarID = await asker(
		'What is the main Google calendar ID? (leave empty to create one) - ',
	);

	if (mainCalendarID === '') {
		mainCalendarID = await createGoogleCalendar(id, name, config);
	}

	const aliases = [];
	let aliasInput = null;
	while (aliasInput) {
		aliasInput = (
			await asker('What is an alias for this account? (blank to have no alias or finish) - ')
		).trim();

		if (!!aliasInput) {
			aliases.push(aliasInput);
		}
	}

	let mainOrgInput = '';
	while (isNaN(parseInt(mainOrgInput, 10))) {
		mainOrgInput = await asker('What is the ORG ID of your unit (not charter number!)? - ');
	}
	const mainOrg = parseInt(mainOrgInput, 10);

	const accountObj: RawCAPSquadronAccountObject = {
		aliases,
		comments: '',
		discordServer,
		id,
		mainCalendarID,
		mainOrg,
		orgIDs: [mainOrg],
		parentGroup: Maybe.none(),
		parentWing: Maybe.none(),
		type: AccountType.CAPSQUADRON,
	};

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	await session
		.getSchema(config.DB_SCHEMA)
		.getCollection<AccountObject>('Accounts')
		.add(accountObj)
		.execute();

	let capidInput = '';
	while (isNaN(parseInt(capidInput, 10))) {
		capidInput = await asker('What is the CAP ID of the new admin? - ');
	}
	const member: MemberReference = {
		type: 'CAPNHQMember',
		id: parseInt(capidInput, 10),
	};

	const backend = backendGenerator(config)(session.getSchema(config.DB_SCHEMA));

	await backend.setPermissions(accountObj)(member)(
		getDefaultAdminPermissions(AccountType.CAPSQUADRON),
	);

	const registry = await backend.getRegistry(accountObj).fullJoin();

	const registryWithName: RegistryValues = {
		...registry,
		Website: {
			...registry.Website,
			Name: name,
		},
	};

	await backend.saveRegistry(registryWithName).fullJoin();

	await session.close();

	readlineInterface.close();

	process.exit();
})();
