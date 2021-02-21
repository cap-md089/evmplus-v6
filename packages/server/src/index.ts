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

import setupDiscordBot from 'discord-bot';
import { getConf } from 'server-common';
import { api } from './api';
import { createSocketUI } from './createSocketUI';
import getServer from './getServer';

console.log = console.log.bind(console);

if (require.main === module) {
	(async () => {
		const configuration = await getConf();

		const { capwatchEmitter, mysqlConn } = await getServer(configuration);

		setupDiscordBot(configuration, capwatchEmitter, mysqlConn);

		createSocketUI(configuration, mysqlConn);
	})().catch(e => {
		console.error(e);
		process.exit(1);
	});
}

process.on('unhandledRejection', up => {
	throw up;
});

export default api;
