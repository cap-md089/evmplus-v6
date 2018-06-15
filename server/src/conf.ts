export const Configuration = {
	database: {
		connection: {
			port: 33389,
			user: 'em',
			password: 'alongpassword2017',
			host: '192.168.45.10',
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