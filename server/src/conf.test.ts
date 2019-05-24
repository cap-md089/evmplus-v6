import conf from './conf';

const conftest: typeof conf = {
	production: false,
	testing: true,
	clientStorage: '/home/arioux/Desktop/react-capunit/client',
	database: {
		connection: {
			database: 'EventManagementTest',
			host: '127.0.0.1',
			password: 'alongpassword2017',
			port: 33060,
			user: 'em'
		},
		connectionCount: 15
	},
	fileStoragePath: '/uploads',
	capwatchFileDownloadDirectory: '/capwatch-zips',
	path: __dirname,
	port: 3001
};

export default conftest;
