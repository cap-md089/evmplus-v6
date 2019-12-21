import { api, asyncRight } from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	Event,
	EventValidator,
	memberRequestTransformer,
	permissionTransformer,
	serverErrorGenerator
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

export default asyncEitherHandler2<api.events.events.Add>(req =>
	asyncRight(req, serverErrorGenerator('Could not create new event'))
		.flatMap(r => Account.RequestTransformer(r))
		.flatMap(r => memberRequestTransformer(false, true)(r))
		.flatMap(r => tokenTransformer(r))
		.flatMap(r => permissionTransformer('ManageEvent')(r))
		.flatMap(r => EventValidator.transform(r))
		.flatMap(r =>
			Event.CreateEither(r.body, r.account, r.mysqlx, r.member).map(event =>
				event.toRaw(r.member)
			)
		)
);
