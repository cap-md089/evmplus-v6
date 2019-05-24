import conf from './conf';

const confproduction: typeof conf = {
	production: true,
	testing: false,
	clientStorage: '/home/arioux/Desktop/react-capunit/client',
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
	capwatchFileDownloadDirectory: '/capwatch-zips',
	fileStoragePath: '/uploads',
	path: __dirname,
	port: 3001
};

export default confproduction;
