import { ServerConfiguration } from 'common-lib';

export default (): ServerConfiguration => {
	return {
		AWS_ACCESS_KEY_ID: '',
		AWS_SECRET_ACCESS_KEY: '',
		DB_HOST: 'mysql',
		DB_PASSWORD: 'toor',
		DB_POOL_SIZE: 50,
		DB_PORT: 33060,
		DB_SCHEMA: 'random',
		DB_USER: 'root',
		DRIVE_STORAGE_PATH: '/srv/uploads',
		GOOGLE_KEYS_PATH: '/google-keys',
		HOST_NAME: 'evmplus.org',
		NODE_ENV: 'test',
		PORT: 3001,
		RECAPTCHA_SECRET: '',
		DISCORD_CLIENT_TOKEN: '',
	};
};
