#!/usr/bin/env node

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
	Validator
} from 'common-lib';
import 'dotenv/config';
import { createInterface } from 'readline';
import { confFromRaw } from 'server-common';
import { setPermissionsForMemberInAccount } from 'server-common/dist/member/pam';

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

if (process.argv.length !== 3) {
	console.error('Error! CAPWATCH file not provided');
	process.exit(2);
}

const conf = confEither.value;

process.on('unhandledRejection', up => {
	throw up;
});

const askQuestion = (rl: ReturnType<typeof createInterface>) => (
	question: string
): Promise<string> =>
	new Promise<string>(res => {
		rl.question(question, res);
	});

(async () => {
	const readlineInterface = createInterface({
		input: process.stdin,
		output: process.stdout
	});

	const asker = askQuestion(readlineInterface);

	let id = null;
	while (!id) {
		if (id !== null) {
			console.log('ID cannot be blank');
		}
		id = await asker('What will be the ID of the new account? - ');
	}

	const serverID = await asker('Is there a Discord server associated with this unit? - ');
	const discordServer: MaybeObj<DiscordServerInformation> =
		serverID === ''
			? Maybe.none()
			: Maybe.some({
					serverID,
					displayFlight: true
			  });

	const mainCalendarID = await asker('What is the main Google calendar ID? - ');

	const aliases = [];
	let aliasInput = null;
	while (!aliasInput) {
		aliasInput = await asker(
			'What is an alias for this account? (blank to have no alias or finish) - '
		);

		if (!!aliasInput) {
			aliases.push(aliasInput);
		}
	}

	const wingCalendarID = await asker(
		'What is the Google calendar ID of the calendar being published to your Wing? - '
	);

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
		wingCalendarID
	};

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER
	});

	await session
		.getSchema(conf.DB_SCHEMA)
		.getCollection<AccountObject>('Accounts')
		.add(accountObj)
		.execute();

	let capidInput = '';
	while (isNaN(parseInt(capidInput, 10))) {
		capidInput = await asker('What is your CAP ID number? - ');
	}
	const member: MemberReference = {
		type: 'CAPNHQMember',
		id: parseInt(capidInput, 10)
	};

	await setPermissionsForMemberInAccount(
		session.getSchema(conf.DB_SCHEMA),
		member,
		getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		accountObj
	);

	await session.close();

	readlineInterface.close();

	process.exit();
})();
