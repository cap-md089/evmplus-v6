import { Server } from 'http';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';

describe('/api', () => {
	describe('/echo', () => {
		let server: Server;

		beforeEach(async () => {
			server = (await getServer(conftest, 3005)).server;
		});

		afterEach(() => {
			server.close();
		});

		// Test is important because certain tests for the client depend
		// on this echo service
		it('should echo what is given to it', done => {
			const payload = {
				hello: 'world'
			};

			request(server)
				.post('/api/echo')
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.send(payload)
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					expect(res.body).toEqual(payload);

					done();
				});
		});
	});
});