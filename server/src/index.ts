#!/usr/bin/env node

import { validator } from 'auto-client-api';
import { Either, RawServerConfiguration, Validator } from 'common-lib';
import setup from 'discord-bot';
import 'dotenv/config';
import { exists, mkdirSync } from 'fs';
import { confFromRaw } from 'server-common';
import getServer from './getServer';

console.log = console.log.bind(console);

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

exists(conf.REMOTE_DRIVE_STORAGE_PATH, dirExists => {
	if (!dirExists) {
		mkdirSync(conf.REMOTE_DRIVE_STORAGE_PATH, 0o750);
	}
});

getServer(conf)
	.then(({ finishServerSetup, capwatchEmitter, mysqlConn, app }) => {
		setup(conf, capwatchEmitter, mysqlConn);

		return finishServerSetup;
	})
	.then(val => {
		val();
		console.log('Server bound');
	});

process.on('unhandledRejection', up => {
	throw up;
});
