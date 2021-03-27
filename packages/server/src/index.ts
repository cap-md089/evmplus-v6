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

import { fork, isMaster } from 'cluster';
import { APIEither, APIEndpoint } from 'common-lib';
import setupDiscordBot from 'discord-bot';
import { cpus } from 'os';
import { BackedServerAPIEndpoint, getConf } from 'server-common';
import { api } from './api';
import { createSocketUI } from './createSocketUI';
import getServer from './getServer';

console.log = console.log.bind(console);

export type Endpoint<
	T extends any,
	A extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>
> = BackedServerAPIEndpoint<T, A>;

if (require.main === module) {
	if (isMaster) {
		const forkCount = cpus().length;

		console.log('Spawning', forkCount, 'workers');
		for (let i = 0; i < forkCount; i++) {
			const child = fork();

			child.on('message', msg => {
				if (msg === 'ready' && i === 0) {
					child.send('setupExtra');
				}
			});
		}
	} else {
		(async () => {
			const configuration = await getConf();
			const { mysqlConn, capwatchEmitter } = await getServer(configuration);

			process.on('message', msg => {
				console.log('Got message:', msg);
				if (msg === 'setupExtra') {
					setupDiscordBot(configuration, capwatchEmitter, mysqlConn);
					createSocketUI(configuration, mysqlConn);
				}
			});

			process.send!('ready');
		})().catch(e => {
			console.error(e);
			process.exit(1);
		});
	}
}

process.on('unhandledRejection', up => {
	throw up;
});

export default api;
