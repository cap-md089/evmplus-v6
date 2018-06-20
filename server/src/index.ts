import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as logger from 'morgan';
import * as path from 'path';
import * as mysql from 'promise-mysql';

import conf, { Configuration } from './conf';

const app: express.Application = express();

const port = normalizePort(process.env.PORT || 3001);
app.set('port', port);
app.disable('x-powered-by');

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Connect to mysql
const pool = mysql.createPool({
	connectionLimit: Configuration.database.connectionCount,
	...Configuration.database.connection
});

const router: express.Router = express.Router();

import MySQLMiddleware, { MySQLRequest } from './lib/MySQLUtil';
router.use(MySQLMiddleware(pool));

router.use((req: MySQLRequest, _, next) => {
	req._originalUrl = req.originalUrl;
	req.originalUrl = 'http' + (req.secure ? 's' : '') + '://' + req.hostname + req.originalUrl;
	next();
});
router.use(logger('dev'));

/**
 * DEFINE API ROUTERS HERE
 */

import filerouter from './api/files/';
router.use('/files', filerouter);

router.get('/signin', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'signin_form.html'));
});

router.use(bodyParser.json({
	strict: false
}));
router.use((req, res, next) => {
	if (typeof req.body !== 'undefined' && req.body === 'teapot') {
		res.status(418);
		res.end();
	} else {
		next();
	}
});

import Account from './lib/Account';
import Member from './lib/members/NHQMember';

import signin from './api/signin';
router.post('/signin', Account.ExpressMiddleware, signin);

import { getFormToken } from './api/formtoken';
router.get('/token', Member.ExpressMiddleware, getFormToken);

import getevents from './api/getevents';
router.post('/events', getevents);

import registry from './api/registry';
router.post('/registry', registry);

import echo from './api/echo';
router.post('/echo', echo);

import blog from './api/blog/';
router.use('/blog', Account.ExpressMiddleware, blog(pool));

router.get('*', (req, res) => {
	res.status(404);
	res.end();
});

/**
 * END DEFINE API ROUTES
 */

app.use('/api', router);

app.get('/images/banner', (req, res) => {
	fs.readdir(path.join(__dirname, '..', 'images', 'banner-images'), (err, data) => {
		if (err) {
			throw err;
		}
		const image = data[Math.round(Math.random() * (data.length - 1))];
		res.sendFile(path.join(__dirname, '..', 'images', 'banner-images', image));
	});
});
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

app.use('/teapot', (req, res) => {
	res.status(418);
	res.end();
});

app.use(express.static(path.join(conf.clientStorage, 'build')));
app.get('*', (req, res) => {
	res.sendFile(path.join(conf.clientStorage, 'build', 'index.html'));
});

function normalizePort(val: number|string): number|string|boolean {
	const portToTest: number = (typeof val === 'string') ? parseInt(val, 10) : val;
	if (isNaN(portToTest)) {
		return val;
	} else if (portToTest >= 0) {
		return portToTest;
	} else {
		return false;
	}
}

function onError(error: NodeJS.ErrnoException): void {
	if (error.syscall !== 'listen') {
		throw error;
	}
	const bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
	switch (error.code) {
		case 'EACCES':
			// tslint:disable-next-line:no-console
			console.error(`${bind} requires elevated privileges`);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			// tslint:disable-next-line:no-console
			console.error(`${bind} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening(): void {
	const addr = server.address();
	const bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
	// tslint:disable-next-line:no-console
	console.log(`Bound on ${bind}`);
}

process.on('beforeExit', () => {
	pool.end();
	server.close();
});

process.stdin.on('data', (data) => {
	// tslint:disable-next-line:no-eval
	eval(data.toString());
});