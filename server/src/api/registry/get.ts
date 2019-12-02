import { api, just, left, right } from 'common-lib';
import { asyncEitherHandler, BasicAccountRequest, Registry } from '../../lib/internals';

export default asyncEitherHandler<api.registry.Get>(async (req: BasicAccountRequest) => {
	try {
		const registry = await Registry.Get(req.account, req.mysqlx);

		return right(registry.values);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not get registry'
		});
	}
});
