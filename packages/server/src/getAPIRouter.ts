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

import * as mysql from '@mysql/xdevapi';
import { addAPI } from 'auto-client-api';
import {
	always,
	Either,
	MemberUpdateEventEmitter,
	ServerConfiguration,
	Validator,
} from 'common-lib';
import * as cors from 'cors';
import * as express from 'express';
import * as logger from 'morgan';
import { getAccountID, MySQLRequest } from 'server-common';
// API Routers
import accountcheck from './api/accountcheck';
import check from './api/check';
import echo from './api/echo';
import errors from './api/errors';
import servererror from './api/errors/servererror';
import events from './api/events';
import files from './api/files';
import { getFormToken } from './api/formtoken';
import getsigninnonce from './api/getsigninnonce';
import getSlideshowImageIDs from './api/getSlideshowImageIDs';
import member from './api/member';
import notifications from './api/notifications';
import registry from './api/registry';
import signin from './api/signin';
import tasks from './api/tasks';
import team from './api/team';
import favicon from './favicon';
// Server libraries
import { endpointAdder } from './lib/API';

export default async (
	conf: ServerConfiguration,
	capwatchUpdateEmitter: MemberUpdateEventEmitter,
	mysqlConn?: mysql.Client,
) => {
	if (!mysqlConn) {
		while (true) {
			try {
				mysqlConn = await mysql.getClient(
					{
						user: conf.DB_USER,
						password: conf.DB_PASSWORD,
						host: conf.DB_HOST,
						port: conf.DB_PORT,
					},
					{
						pooling: {
							enabled: true,
							maxSize: conf.DB_POOL_SIZE,
						},
					},
				);

				await mysqlConn.getSession();

				break;
			} catch (e) {
				console.log('Could not get a connection. Waiting one second...');
				console.error(e);
				await new Promise<void>(res => setTimeout(res, 1000));
				console.log(`Retrying connection to ${conf.DB_HOST}:${conf.DB_PORT}...`);
			}
		}
	}

	const router: express.Router = express.Router();

	const corsOptions: cors.CorsOptions = {
		origin(origin, callback) {
			if (
				process.env.NODE_ENV !== 'production' ||
				origin?.endsWith(`.${conf.HOST_NAME}`) ||
				!origin
			) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Authorization', 'Content-Type', 'authorization', 'content-type'],
	};

	// router.use(cors(corsOptions));

	router.options('*', cors(corsOptions));

	const setupDatabase = async (
		request: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		const req = (request as unknown) as MySQLRequest;

		try {
			const session = await mysqlConn!.getSession();

			req.mysqlx = session.getSchema(conf.DB_SCHEMA);
			req.memberUpdateEmitter = capwatchUpdateEmitter;
			req.mysqlxSession = session;
			req.configuration = conf;
			req._originalUrl = req.originalUrl;

			next();
		} catch (e) {
			console.error(e);
			res.status(500);
			res.end();
		}
	};

	/**
	 * Use API Routers
	 */
	router.use('/api', setupDatabase);

	if (conf.NODE_ENV === 'development') {
		router.use(logger('dev'));
	} else if (conf.NODE_ENV === 'production') {
		logger.token('account', (req, res) => {
			if ('hostname' in req && typeof (req as any).hostname === 'string') {
				const accountID = getAccountID((req as any).hostname);

				return Either.cata(always('UNKNOWN'))((id: string) => id)(accountID);
			} else {
				return 'UNKNOWN';
			}
		});
		router.use(
			logger(
				':account :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]',
			),
		);
	}

	router.use(errors);
	router.use(events);
	router.use(files);
	router.use(member);
	router.use(notifications);
	router.use(registry);
	router.use(tasks);
	router.use(team);

	const adder = endpointAdder(router) as () => () => void;

	addAPI(Validator, adder, signin);
	addAPI(Validator, adder, getFormToken);
	addAPI(Validator, adder, getSlideshowImageIDs);
	addAPI(Validator, adder, check);
	addAPI(Validator, adder, accountcheck);
	addAPI(Validator, adder, echo);
	addAPI(Validator, adder, getsigninnonce);

	router.use((servererror as unknown) as express.ErrorRequestHandler);

	router.use('/api', async (request, response) => {
		const req = (request as unknown) as MySQLRequest;

		if (req.mysqlxSession) {
			await req.mysqlxSession.close();
		}

		response.status(404);
		response.json({
			direction: 'left',
			value: {
				type: 'OTHER',
				code: 404,
				message: 'API not found',
			},
		});
	});

	router.get('/favicon.ico', setupDatabase, favicon);

	return {
		router,
		capwatchEmitter: capwatchUpdateEmitter,
		mysqlConn,
	};
};
