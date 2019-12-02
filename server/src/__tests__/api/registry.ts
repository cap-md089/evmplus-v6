import { right } from 'common-lib';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer, { ServerConfiguration } from '../../getServer';
import { getTestTools, Registry } from '../../lib/internals';

describe('/api', () => {
	describe('/registry', () => {
		let server: ServerConfiguration;
		let registry: Registry;

		beforeEach(async done => {
			server = await getServer(conftest, 3009);

			const { schema, account } = await getTestTools(conftest);

			registry = await Registry.Get(account, schema);

			done();
		});

		afterEach(async done => {
			server.server.close();

			await server.mysqlConn.close();

			done();
		});

		it('should get the registry for the developer account', done => {
			request('http://mdx89.localcapunit.com:3009')
				.get('/api/registry')
				.expect('content-type', 'application/json; charset=utf-8')
				.expect(200, JSON.parse(JSON.stringify(right(registry.values))), done);
		}, 5000);

		it('should give a 400 for a non existant account', done => {
			request('http://noacc.localcapunit.com:3009')
				.get('/api/registry')
				.expect(400)
				.end(done);
		}, 5000);
	});
});
