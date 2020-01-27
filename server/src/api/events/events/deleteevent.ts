import { api, asyncRight } from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	Event,
	memberRequestTransformer,
	serverErrorGenerator
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

export default asyncEitherHandler2<api.events.events.Delete, { id: string }>(r =>
	asyncRight(r, serverErrorGenerator('Could not delete event'))
		.flatMap(req => Account.RequestTransformer(req))
		.flatMap(req => memberRequestTransformer(false, true)(req))
		.flatMap(req => tokenTransformer(req))
		.flatMap(req =>
			Event.GetEither(req.params.id, req.account, req.mysqlx)
				.setErrorValue(serverErrorGenerator('Could not delete event'))
				.map(event => event.delete())
		)
);
