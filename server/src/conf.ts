export const Configuration = {
	production: false,
	testing: false,
	clientStorage: '/home/arioux/typescript-capunit/client',
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
	path: __dirname,
	port: 3001
};

const conf = Configuration;

export default conf;
