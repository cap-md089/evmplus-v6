import * as http from 'http';
import * as debug from 'debug';
import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

import { Configuration } from './conf';

const app: express.Application = express();

const port = normalizePort(process.env.PORT || 3001);
app.set('port', port);

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

let router: express.Router = express.Router();


/**
 * DEFINE ROUTERS HERE
 */

import getevents from './apis/getevents';
router.post('/events', getevents(Configuration));

import signin from './apis/signin';
router.post('/signin', signin(Configuration));

import registry from './apis/registry';
router.post('/registry', registry(Configuration));


router.get('/signin', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'signin_form.html'));
});

/**
 * END DEFINE ROUTES
 */

app.use('/api', router);

app.get('/images/banner', (req, res) => {
	fs.readdir(path.join(__dirname, '..', 'images', 'banner-images'), (err, data) => {
		if (err) throw err;
		let image = data[Math.round(Math.random() * (data.length - 1))];
		res.sendFile(path.join(__dirname, '..', 'images', 'banner-images', image));
	});
});
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

function normalizePort(val: number|string): number|string|boolean {
	let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
	if (isNaN(port)) return val;
	else if (port >= 0) return port;
	else return false;
}

function onError(error: NodeJS.ErrnoException): void {
	if (error.syscall !== 'listen') throw error;
	let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
	switch(error.code) {
		case 'EACCES':
			console.error(`${bind} requires elevated privileges`);
			process.exit(1);
			break;
		case 'EADDRINUSE':
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
	debug(`Listening on ${bind}`);
}