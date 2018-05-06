import * as http from 'http';
import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as mysql from 'mysql';

import { Configuration } from './conf';

const app: express.Application = express();

const port = normalizePort(process.env.PORT || 3001);
app.set('port', port);
app.disable('x-powered-by');

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

app.use(logger('dev'));

// Connect to mysql
const pool = mysql.createPool({
	connectionLimit: Configuration.database.connectionCount,
	...Configuration.database.connection
});

let router: express.Router = express.Router();

/**
 * DEFINE API ROUTERS HERE
 */

import filerouter from './api/files/';
router.use('/files', filerouter(Configuration));

router.get('/signin', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'signin_form.html'));
});

router.use(bodyParser.json());

import Account from './lib/Account';
import Member from './lib/Member';

import signin from './api/signin';
router.post('/signin', signin);

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
		let image = data[Math.round(Math.random() * (data.length - 1))];
		res.sendFile(path.join(__dirname, '..', 'images', 'banner-images', image));
	});
});
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

app.use('/teapot', (req, res) => {
	res.status(418);
	res.end();
});

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

function normalizePort(val: number|string): number|string|boolean {
	let _port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
	if (isNaN(_port)) {
		return val;
	} else if (_port >= 0) {
		return _port;
	} else {
		return false;
	}
}

function onError(error: NodeJS.ErrnoException): void {
	if (error.syscall !== 'listen') {
		throw error;
	}
	let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
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
	let addr = server.address();
	let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
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