import { Server } from 'http';
import * as request from 'supertest';
import conf from '../conf.test';
import getServer from '../getServer';

describe ('any url that is not an image, build file, or api call', () => {
	let server: Server;

	beforeEach(async () => {
		server = (await getServer(conf, 3002)).server;
	});

	afterEach(() => {
		server.close();
	});

	it ('should respond with an HTML file', done => {
		request(server)
			.get('/not/a/real/url')
			.expect('Content-type', 'text/html; charset=utf-8')
			.end(done);
	});

	it('should respond with 404', done => {
		request(server)
			.get('/api/not/a/real/api')
			.expect(404, done);
	})
});