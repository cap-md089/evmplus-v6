#!/usr/bin/env node

import { getSession } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import { Either, RawServerConfiguration, Validator } from 'common-lib';
import 'dotenv/config';
import { confFromRaw, ImportCAPWATCHFile } from 'server-common';

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

const capwatchPath = process.argv[2];

if (!capwatchPath.startsWith('/')) {
	console.error('Error! CAPWATCH file path must be absolute');
	process.exit(3);
}

const conf = confEither.value;

process.on('unhandledRejection', (up) => {
	throw up;
});

(async () => {
	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	// @ts-ignore
	const schema = session.getSchema(conf.DB_SCHEMA);

	const capImport = ImportCAPWATCHFile(capwatchPath, schema, session);

	for await (const i of capImport) {
		console.log(i);
	}

	process.exit();
})();
