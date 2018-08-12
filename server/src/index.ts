import { Session } from '@mysql/xdevapi';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import conf from './conf';
import getRouter from './getAPIRouter';

const app: express.Application = express();

const port = conf.port;
app.set('port', port);
app.disable('x-powered-by');

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

let mysqlConn: Session;

getRouter(conf).then(({
	router,
	session
}) => {
	mysqlConn = session;

	app.use('/api', router);

	app.get('/images/banner', (req, res) => {
		fs.readdir(
			path.join(__dirname, '..', 'images', 'banner-images'),
			(err, data) => {
				if (err) {
					throw err;
				}
				const image = data[Math.round(Math.random() * (data.length - 1))];
				res.sendFile(
					path.join(__dirname, '..', 'images', 'banner-images', image)
				);
			}
		);
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

	// tslint:disable-next-line:no-console
	console.log('Server set up');
});

function onError(error: NodeJS.ErrnoException): void {
	if (error.syscall !== 'listen') {
		throw error;
	}
	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
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
	const bind =
		typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
	// tslint:disable-next-line:no-console
	console.log(`Bound on ${bind}`);
}

process.on('beforeExit', () => {
	mysqlConn.close();
	server.close();
});

process.stdin.on('data', data => {
	// tslint:disable-next-line:no-eval
	eval(data.toString());
});
