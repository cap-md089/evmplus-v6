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

import { validator } from 'auto-client-api';
import { Either, RawServerConfiguration, Validator } from 'common-lib';
import setup from 'discord-bot';
import 'dotenv/config';
import { confFromRaw } from 'server-common';
import { createSocketUI } from './createSocketUI';
import getServer from './getServer';

console.log = console.log.bind(console);

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

getServer(conf)
	.then(({ finishServerSetup, capwatchEmitter, mysqlConn, app }) => {
		setup(conf, capwatchEmitter, mysqlConn);

		createSocketUI(conf, mysqlConn);

		return finishServerSetup;
	})
	.then(val => {
		val();
		console.log('Server bound');
	});

process.on('unhandledRejection', up => {
	throw up;
});
