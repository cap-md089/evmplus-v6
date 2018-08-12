import { join } from 'path';

export const Configuration = {
	clientStorage: '/home/andrew/Desktop/react-capunit/client',
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
	path: __dirname,
	testing: true,
	unitTestDatabase: {
		connection: {
			database: 'EventManagementTests',
			host: '192.168.45.10',
			password: 'alongpassword2017',
			port: 33060,
			user: 'em'
		},
		connectionCount: 15
	},
	port: 3001,
	schemaPath: join(__dirname, '..', 'schemas')
};

const conf = Configuration;

export default conf;