import { Client } from '@mysql/xdevapi';
import { MemberUpdateEventEmitter, ServerConfiguration } from 'common-lib';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import getRouter from './getAPIRouter';

export interface ServerInitializationOptions {
	capwatchEmitter: MemberUpdateEventEmitter;
	conf: ServerConfiguration;
	finishServerSetup: () => void;
	server: http.Server;
	app: express.Application;
	mysqlConn: Client;
}

export default async (
	conf: ServerConfiguration,
	port: number = conf.PORT,
	mysqlConn?: Client
): Promise<ServerInitializationOptions> => {
	const app: express.Application = express();

	app.set('port', port);
	app.disable('x-powered-by');
	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	const { router: apiRouter, capwatchEmitter, mysqlConn: mysql } = await getRouter(
		conf,
		mysqlConn
	);

	app.use((req, res, next) => {
		res.removeHeader('X-Powered-By');
		next();
	});
	app.disable('x-powered-by');

	app.use(apiRouter);

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

	if (conf.NODE_ENV === 'production') {
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
		const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
		if (conf.NODE_ENV === 'production') {
			console.log(`Bound on ${bind}`);
		}
	}

	process.on('beforeExit', () => {
		mysql.close();
		server.close();
	});

	return {
		app,
		server,
		capwatchEmitter,
		conf,
		mysqlConn: mysql,
		finishServerSetup() {
			app.use(express.static(path.join(conf.CLIENT_PATH, 'build')));
			app.get('*', (req, res) => {
				res.sendFile(path.join(conf.CLIENT_PATH, 'build', 'index.html'));
			});
		},
	};
};
