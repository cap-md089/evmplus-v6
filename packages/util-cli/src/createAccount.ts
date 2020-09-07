#!/usr/bin/env node
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	AccountObject,
	AccountType,
	DiscordServerInformation,
	Either,
	getDefaultAdminPermissions,
	Maybe,
	MaybeObj,
	MemberReference,
	RawCAPSquadronAccountObject,
	RawServerConfiguration,
	RegistryValues,
	Validator,
} from 'common-lib';
import 'dotenv/config';
import { createInterface } from 'readline';
import { PAM, confFromRaw, createGoogleCalendar, getRegistry, saveRegistry } from 'server-common';

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

process.on('unhandledRejection', up => {
	throw up;
});

const askQuestion = (rl: ReturnType<typeof createInterface>) => (
	question: string,
): Promise<string> =>
	new Promise<string>(res => {
		rl.question(question, res);
	});

(async () => {
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
		id = await asker('What will be the ID of the new account? - ');
	}

	let name = null;
	while (!name) {
		if (name !== null) {
			console.log('Website name cannot be blank');
		}
		name = await asker('What is the name of the new account? - ');
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
		mainCalendarID = await createGoogleCalendar(id, name, conf);
	}

	const aliases = [];
	let aliasInput = null;
	while (!aliasInput) {
		aliasInput = await asker(
			'What is an alias for this account? (blank to have no alias or finish) - ',
		);

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
		orgIDs: [],
		parentGroup: Maybe.none(),
		parentWing: Maybe.none(),
		type: AccountType.CAPSQUADRON,
	};

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	await session
		.getSchema(conf.DB_SCHEMA)
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

	await PAM.setPermissionsForMemberInAccount(
		session.getSchema(conf.DB_SCHEMA),
		member,
		getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		accountObj,
	);

	const registry = await getRegistry(session.getSchema(conf.DB_SCHEMA))(accountObj).fullJoin();

	const registryWithName: RegistryValues = {
		...registry,
		Website: {
			...registry.Website,
			Name: name,
		},
	};

	await saveRegistry(session.getSchema(conf.DB_SCHEMA))(registryWithName).fullJoin();

	await session.close();

	readlineInterface.close();

	process.exit();
})();
