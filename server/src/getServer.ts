import { Session } from '@mysql/xdevapi';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { Configuration } from './conf';
import getRouter from './getAPIRouter';

export default async (conf: typeof Configuration, port: number = conf.port, mysqlConn?: Session) => {
	const app: express.Application = express();

	app.set('port', port);
	app.disable('x-powered-by');
	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	const { router, session } = await getRouter(conf, mysqlConn);

	mysqlConn = session;

	app.use((req, res, next) => {
		res.removeHeader('X-Powered-By');
		next();
	});
	app.disable('x-powered-by');

	app.use('/api/v1', router);
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

	if (!conf.testing) {
		// tslint:disable-next-line:no-console
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
		const bind =
			typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
		if (!conf.testing) {
			console.log(`Bound on ${bind}`);
		}
	}

	process.on('beforeExit', () => {
		mysqlConn.close();
		server.close();
	});

	return {
		app,
		server
	};
}