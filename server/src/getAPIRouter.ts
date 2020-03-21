import * as mysql from '@mysql/xdevapi';
import * as bodyParser from 'body-parser';
import { left } from 'common-lib';
import * as express from 'express';
import * as logger from 'morgan';
import accountcheck from './api/accountcheck';
import check from './api/check';
import echo from './api/echo';
import clienterror, { ClientErrorValidator } from './api/errors/clienterror';
import geterrors from './api/errors/geterrors';
import markerrordone from './api/errors/markerrordone';
import servererror from './api/errors/servererror';
import events from './api/events';
import filerouter from './api/files';
import { getFormToken } from './api/formtoken';
import getSlideshowImageIDs from './api/getSlideshowImageIDs';
import members from './api/member';
import { capwatchEmitter } from './api/member/capwatch/import';
import notifications from './api/notifications';
import registry from './api/registry';
import signin from './api/signin';
import team from './api/team';
import { Configuration } from './conf';
import {
	Account,
	leftyConditionalMemberMiddleware,
	MySQLMiddleware,
	MySQLRequest,
	Validator
} from './lib/internals';

export default async (conf: typeof Configuration, session?: mysql.Session) => {
	const router: express.Router = express.Router();

	const { database: schema, host, password, port: mysqlPort, user } = conf.database.connection;

	if (typeof session === 'undefined') {
		session = await mysql.getSession({
			host,
			password,
			port: mysqlPort,
			user
		});
	}

	const eventManagementSchema = session.getSchema(schema);

	/**
	 * Use API Routers
	 */
	router.use('*', MySQLMiddleware(eventManagementSchema, session, conf));

	router.use((req: MySQLRequest, _, next) => {
		req._originalUrl = req.originalUrl;
		req.originalUrl = 'http' + (req.secure ? 's' : '') + '://' + req.hostname + req.originalUrl;
		next();
	});

	if (!conf.testing) {
		router.use(logger('dev'));
	}

	router.use('/files', filerouter);

	router.use(
		bodyParser.json({
			strict: false
		})
	);

	router.use((req, res, next) => {
		if (typeof req.body !== 'undefined' && req.body === 'teapot') {
			res.status(418);
			res.end();
		} else if (typeof req.body !== 'object') {
			res.status(400);
			return res.json(
				left({
					code: 400,
					error:
						'Body is not recognized as properly formatted JSON. Either the JSON is invalid or a "content-type" header is missing'
				})
			);
		} else {
			next();
		}
	});

	router.post('/signin', Account.LeftyExpressMiddleware, signin);

	router.get('/token', getFormToken);

	router.get(
		'/banner',
		Account.LeftyExpressMiddleware,
		leftyConditionalMemberMiddleware,
		getSlideshowImageIDs
	);

	router.use('/registry', registry);

	router.get('/accountcheck', Account.LeftyExpressMiddleware, accountcheck);

	router.post('/echo', echo);

	router.use('/check', Account.LeftyExpressMiddleware, leftyConditionalMemberMiddleware, check);

	router.use('/event', events);

	router.use('/team', team);

	router.use('/member', Account.LeftyExpressMiddleware, members);

	router.use('/notifications', notifications);

	router.post(
		'/clienterror',
		Account.LeftyExpressMiddleware,
		leftyConditionalMemberMiddleware,
		Validator.LeftyBodyExpressMiddleware(ClientErrorValidator),
		clienterror
	);

	router.get('/errors', geterrors);
	router.post('/errors', markerrordone);

	router.use('*', (req, res) => {
		res.status(404);
		res.end();
	});

	router.use(
		Account.LeftyExpressMiddleware,
		leftyConditionalMemberMiddleware,
		(servererror as unknown) as express.ErrorRequestHandler
	);

	return {
		router,
		session,
		capwatchEmitter
	};
};
