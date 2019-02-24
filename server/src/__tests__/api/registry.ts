import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import { getTestTools } from '../../lib/Util';

describe('/api', () => {
	describe('/registry', () => {
		let server: Server;

		beforeEach(async () => {
			server = (await getServer(conftest, 3009)).server;

			await getTestTools(conftest);
		});

		afterEach(() => {
			server.close();
		});

		it('should get the registry for the developer account', done => {
			request('http://mdx89.localcapunit.com:3009')
				.get('/api/registry')
				.expect(200)
				.expect('content-type', 'application/json; charset=utf-8')
				.end(done);
		});

		it('should give a 400 for a non existant account', done => {
			request('http://noacc.localcapunit.com:3009')
				.get('/api/registry')
				.expect(400)
				.end(done);
		});
	});
});
