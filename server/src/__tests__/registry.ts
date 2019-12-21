import get from '../api/registry/get';
import conftest from '../conf.test';
import getServer, { ServerConfiguration } from '../getServer';
import { getTestTools, Registry } from '../lib/internals';
import './EitherMatcher';
import { addAccountForTransformer, prepareBasicGetRequest, resolveToEither } from './TestUtils';

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

		it('should get the registry for the developer account', async done => {
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, server.mysqlConn, '/api/registry'),
				'mdx89'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchRight(registry.values);

			done();
		});

		it('should give a 400 for a non existant account', async done => {
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, server.mysqlConn, '/api/registry'),
				'noacc'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchLeft({
				code: 400
			});

			done();
		});
	});
});
