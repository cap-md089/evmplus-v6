import * as mysql from '@mysql/xdevapi';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import { join } from 'path';
import accountcheck from './api/accountcheck';
import blog from './api/blog';
import check from './api/check';
import echo from './api/echo';
import events from './api/events';
import filerouter from './api/files';
import { getFormToken } from './api/formtoken';
import registry from './api/registry';
import signin from './api/signin';
import { Configuration } from './conf';
import Account from './lib/Account';
import Member from './lib/members/NHQMember';
import MySQLMiddleware, { MySQLRequest } from './lib/MySQLUtil';

export default async (conf: typeof Configuration, session?: mysql.Session) => {
	const router: express.Router = express.Router();

	const {
		database: schema,
		host,
		password,
		port: mysqlPort,
		user
	} = conf.database.connection;

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
	router.use(MySQLMiddleware(eventManagementSchema));

	router.use((req: MySQLRequest, _, next) => {
		req._originalUrl = req.originalUrl;
		req.originalUrl =
			'http' +
			(req.secure ? 's' : '') +
			'://' +
			req.hostname +
			req.originalUrl;
		next();
	});

	if (!conf.testing) {
		router.use(logger('dev'));
	}

	router.use('/files', filerouter);

	router.get('/signin', (req, res) => {
		res.sendFile(join(__dirname, '..', 'signin_form.html'));
	});

	router.use(
		bodyParser.json({
			strict: false
		})
	);
	router.use((req, res, next) => {
		if (typeof req.body !== 'undefined' && req.body === 'teapot') {
			res.status(418);
			res.end();
		} else {
			next();
		}
	});

	router.post('/signin', Account.ExpressMiddleware, signin);

	router.get(
		'/token',
		Account.ExpressMiddleware,
		Member.ExpressMiddleware,
		getFormToken
	);

	router.use('/registry', registry);

	router.get('/accountcheck', Account.ExpressMiddleware, accountcheck);

	router.post('/echo', echo);

	router.use(
		'/check',
		Account.ExpressMiddleware,
		Member.ExpressMiddleware,
		check
	);

	router.use('/blog', Account.ExpressMiddleware, blog);

	router.use('/event', events);

	router.use('*', (req, res) => {
		res.status(404);
		res.end();
	});

	return {
		router,
		session
	};
};
