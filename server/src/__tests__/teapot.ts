import { Server } from 'http';
import * as request from 'supertest';
import conf from '../conf.test';
import getServer from '../getServer';

describe('/teapot', () => {
	let server: Server;

	beforeEach(async () => {
		server = (await getServer(conf, 3003)).server;
	});

	afterEach(() => {
		server.close();
	});

	it('should respond with HTTP 418', done => {
		request(server).get('/teapot').expect(418, done);
	});

	it('should respond to a body of "teapot"', done => {
		request(server)
			.post('/api/echo')
			.set('Accept', 'application/json')
			.set('Content-type', 'application/json')
			.send('"teapot"')
			.expect(418, done);
	});
});
