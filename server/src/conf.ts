import { join } from 'path';

export const Configuration = {
	production: false,
	testing: false,
	clientStorage: join(__dirname, '..', 'client'),
	database: {
		connection: {
			database: 'EventManagement4',
			host: '127.0.0.1',
			password: 'alongpassword2017',
			port: 33060,
			user: 'em'
		},
		connectionCount: 15
	},
	fileStoragePath: '/uploads',
	capwatchFileDownloadDirectory: '/capwatch-zips',
	googleKeysPath: '/google-keys',
	path: __dirname,
	port: 3001
};

const conf = Configuration;

export default conf;
