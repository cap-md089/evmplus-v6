import { api, asyncRight } from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	Event,
	memberRequestTransformer,
	serverErrorGenerator,
	SessionType
} from '../../../lib/internals';

export default asyncEitherHandler2<api.events.events.Get, { id: string }>(req =>
	asyncRight(req, serverErrorGenerator('Could not get event'))
		.flatMap(r => Account.RequestTransformer(r))
		.flatMap(r => memberRequestTransformer(SessionType.REGULAR, false)(r))
		.flatMap(r =>
			Event.GetEither(r.params.id, r.account, r.mysqlx).flatMap(ev =>
				asyncRight(ev, serverErrorGenerator('Could not get member information'))
					.map<boolean>(async () => {
						if (r.member.isSome()) {
							const member = r.member.some();
							for await (const account of member.getAccounts()) {
								if (account.id === r.account.id) {
									return true;
								}
							}
						}

						return false;
					})
					.map(memberValid => ev.toRaw(memberValid ? r.member.some() : null))
			)
		)
);
