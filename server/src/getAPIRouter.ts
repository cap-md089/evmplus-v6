import * as mysql from '@mysql/xdevapi';
import { addAPI } from 'auto-client-api';
import { MemberUpdateEventEmitter, ServerConfiguration, Validator } from 'common-lib';
import * as cors from 'cors';
import { EventEmitter } from 'events';
import * as express from 'express';
import * as logger from 'morgan';
import { MySQLRequest } from 'server-common';
// API Routers
import accountcheck from './api/accountcheck';
import check from './api/check';
import echo from './api/echo';
import errors from './api/errors';
import servererror from './api/errors/servererror';
import events from './api/events';
import files from './api/files';
import { getFormToken } from './api/formtoken';
import getSlideshowImageIDs from './api/getSlideshowImageIDs';
import member from './api/member';
import notifications from './api/notifications';
import registry from './api/registry';
import signin from './api/signin';
import tasks from './api/tasks';
import team from './api/team';
// Server libraries
import { endpointAdder } from './lib/API';

export default async (conf: ServerConfiguration, mysqlConn?: mysql.Client) => {
	if (!mysqlConn) {
		mysqlConn = await mysql.getClient(
			`mysqlx://${conf.DB_USER}:${conf.DB_PASSWORD}@${conf.DB_HOST}:${conf.DB_PORT}`,
			{
				pooling: {
					enabled: true,
					maxSize: conf.DB_POOL_SIZE,
				},
			}
		);
	}

	const router: express.Router = express.Router();

	const updateEmitter: MemberUpdateEventEmitter = new EventEmitter();

	const corsOptions: cors.CorsOptions = {
		origin(origin, callback) {
			if (
				origin?.endsWith(
					process.env.NODE_ENV === 'productoin'
						? '.capunit.com'
						: '.localcapunit.com:3000'
				) ||
				!origin
			) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Authorizatoin', 'Content-Type', 'authorization', 'content-type'],
	};

	router.use(cors(corsOptions));

	router.options('*', cors(corsOptions));

	/**
	 * Use API Routers
	 */
	router.use(
		'/api',
		async (request: express.Request, res: express.Response, next: express.NextFunction) => {
			const req = (request as unknown) as MySQLRequest;

			try {
				const session = await mysqlConn!.getSession();

				req.mysqlx = session.getSchema(conf.DB_SCHEMA);
				req.memberUpdateEmitter = updateEmitter;
				req.mysqlxSession = session;
				req.configuration = conf;
				req._originalUrl = req.originalUrl;

				next();
			} catch (e) {
				console.error(e);
				res.status(500);
				res.end();
			}
		}
	);

	if (conf.NODE_ENV !== 'test') {
		router.use(logger('dev'));
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

	return {
		router,
		capwatchEmitter: updateEmitter,
		mysqlConn,
	};
};
