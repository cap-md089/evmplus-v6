/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-no-check

const proxy = require('http-proxy-middleware');

console.log('Using proxy target:', process.env.PROXY);

const target = process.env.PROXY || 'localhost';

module.exports = function (app) {
	app.use(
		proxy('/api', {
			target: `http://${target}:3001`,
		}),
		proxy('/favicon.ico', {
			target: `http://${target}:3001`,
		}),
		proxy('/images', {
			target: `http://${target}:3001`,
		}),
	);
};
