import * as request from 'supertest';
import conftest from '../conf.test';
import getServer, { ServerInitializationOptions } from '../getServer';

describe('/api', () => {
	describe('/echo', () => {
		let server: ServerInitializationOptions;

		beforeEach(async done => {
			server = await getServer(conftest, 3005);

			done();
		});

		afterEach(() => {
			server.server.close();
		});

		// Test is important because certain tests for the client depend
		// on this echo service
		it('should echo what is given to it', done => {
			const payload = {
				hello: 'world',
			};

			request(server.server)
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
