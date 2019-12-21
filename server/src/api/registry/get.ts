import { api, asyncRight } from 'common-lib';
import { Account, asyncEitherHandler2, Registry, serverErrorGenerator } from '../../lib/internals';

export default asyncEitherHandler2<api.registry.Get>(r =>
	asyncRight(r, serverErrorGenerator('Could not get registry information'))
		.flatMap(req => Account.RequestTransformer(req))
		.map(
			req => Registry.Get(req.account, req.mysqlx),
			serverErrorGenerator('Could not get registry values')
		)
		.map(reg => reg.values)
);
