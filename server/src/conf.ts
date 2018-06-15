export const Configuration = {
	database: {
		connection: {
			port: 3306,
			user: 'em',
			password: 'alongpassword2016',
			host: '127.0.0.1',
			database: 'EventManagement4'
		},
		connectionCount: 15
	},
	path: __dirname,
	testing: true,
	fileStoragePath: '/uploads',
	clientStorage: '/home/andrew/Desktop/react-capunit-client'
};

const conf = Configuration;

export default conf;