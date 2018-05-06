export interface MyConfiguration {
	database: {
		connection: {
			port: number,
			user: string,
			password: string,
			host: string,
			database: string
		}
		connectionCount: number
	};
	path: string;
	testing: boolean;
	fileStoragePath: string;
}

export const Configuration: MyConfiguration = {
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
	fileStoragePath: '/home/arioux/Desktop/uploads'
};