import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer, { ServerConfiguration } from '../../getServer';

describe('/api', () => {
	describe('/echo', () => {
		let server: ServerConfiguration;

		beforeEach(async done => {
			server = await getServer(conftest, 3005);

			done();
		});

		afterEach(async done => {
			server.server.close();
			await server.mysqlConn.close();

			done();
		});

		// Test is important because certain tests for the client depend
		// on this echo service
		it('should echo what is given to it', done => {
			const payload = {
				hello: 'world'
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
