import get from '../api/registry/get';
import conftest from '../conf.test';
import getServer, { ServerInitializationOptions } from '../getServer';
import './EitherMatcher';
import { addAccountForTransformer, prepareBasicGetRequest, resolveToEither } from './TestUtils';

describe('/api', () => {
	describe('/registry', () => {
		let server: ServerInitializationOptions;
		let registry: Registry;

		beforeEach(async done => {
			server = await getServer(conftest, 3009);

			const { schema, account } = await getTestTools(conftest);

			registry = await Registry.Get(account, schema);

			done();
		});

		afterEach(async done => {
			server.server.close();

			done();
		});

		it('should get the registry for the developer account', async done => {
			const session = await getSession(conftest);
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, session, '/api/registry'),
				'mdx89'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchRight(registry.values);

			done();
		});

		it('should give a 400 for a non existant account', async done => {
			const session = await getSession(conftest);
			const req = addAccountForTransformer(
				prepareBasicGetRequest(conftest, {}, session, '/api/registry'),
				'noacc'
			);

			const res = await resolveToEither(get.fn(req));

			expect(res).toMatchLeft({
				code: 400,
			});

			done();
		});
	});
});
