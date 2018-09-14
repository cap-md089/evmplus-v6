import conftest from '../../conf.test';
import Registry from '../../lib/Registry';
import { getTestTools } from '../../lib/Util';

describe('registry', async () => {
	const { account, schema } = await getTestTools(conftest);

	it('should get successfully', async done => {
		const registry = await Registry.Get(account, schema);

		expect(registry.values.accountID).toEqual(expect.any(String));
	});
});
