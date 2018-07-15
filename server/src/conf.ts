export const Configuration = {
	clientStorage: '/home/andrew/Desktop/react-capunit-client',
	database: {
		connection: {
			database: 'EventManagement4',
			host: 'localhost',
			password: 'alongpassword2016',
			port: 3306,
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
			port: 33389,
			user: 'em'
		},
		connectionCount: 15
	}
};

const conf = Configuration;

export default conf;