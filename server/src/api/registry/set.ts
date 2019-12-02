import { just, left, RegistryValues, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicPartialMemberValidatedRequest,
	Registry
} from '../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicPartialMemberValidatedRequest<RegistryValues>) => {
		try {
			const registry = await Registry.Get(req.account, req.mysqlx);

			registry.set(req.body);

			await registry.save();

			return right(void 0);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save registry information'
			});
		}
	}
);
