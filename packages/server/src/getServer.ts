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

import { Client } from '@mysql/xdevapi';
import { MemberUpdateEventEmitter, ServerConfiguration } from 'common-lib';
import { EventEmitter } from 'events';
import * as express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import setupCapwatchImporter from './api/member/capwatch/importcapwatch';
import getRouter from './getAPIRouter';

export interface ServerInitializationOptions {
	capwatchEmitter: MemberUpdateEventEmitter;
	conf: ServerConfiguration;
	server: http.Server;
	app: express.Application;
	mysqlConn: Client;
}

export default async (
	conf: ServerConfiguration,
	port: number = conf.PORT,
	capwatchEmitter?: MemberUpdateEventEmitter,
	mysqlConn?: Client,
): Promise<ServerInitializationOptions> => {
	const app: express.Application = express();

	app.set('port', port);
	app.disable('x-powered-by');
	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);
	const socketIo = new Server(server);

	capwatchEmitter ??= new EventEmitter();

	const { router: apiRouter, mysqlConn: mysql } = await getRouter(
		conf,
		capwatchEmitter,
		mysqlConn,
	);

	app.use((req, res, next) => {
		res.removeHeader('X-Powered-By');
		next();
	});
	app.disable('x-powered-by');

	setupCapwatchImporter(conf, mysql, socketIo, capwatchEmitter);

	app.use(apiRouter);

	app.use('/teapot', (req, res) => {
		res.status(418);
		res.end();
	});

	if (conf.NODE_ENV === 'production') {
		// eslint-disable-next-line no-console
		console.log('Server set up');
	}

	function onError(error: NodeJS.ErrnoException): void {
		console.error(error);

		if (error.code === 'EACCES' || error.code === 'EADDRINUSE') {
			console.error(error.code);
			process.exit(1);
		}
	}

	function onListening(): void {
		const addr = server.address();
		const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port ?? 0}`;
		if (conf.NODE_ENV === 'production') {
			console.log(`Bound on ${bind}`);
		}
	}

	process.on('beforeExit', () => {
		void mysql.close();
		server.close();
	});

	return {
		app,
		server,
		capwatchEmitter,
		conf,
		mysqlConn: mysql,
	};
};
