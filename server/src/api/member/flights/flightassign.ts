import { api, just, left, none, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	FlightAssign,
	Registry,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler<api.member.flights.Assign>(
	async (req: BasicMemberValidatedRequest<FlightAssign>) => {
		let member;

		try {
			member = await resolveReference(req.body.member, req.account, req.mysqlx, true);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find member specified'
			});
		}

		if (typeof req.body.newFlight !== 'string') {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Flight is required in order to set flight for member'
			});
		}

		try {
			const registry = await Registry.Get(req.account, req.mysqlx);

			if (!registry.values.RankAndFile.Flights.includes(req.body.newFlight)) {
				return left({
					code: 400,
					error: none<Error>(),
					message: 'Flight specified is not a valid flight'
				});
			}
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not get registry for account'
			});
		}

		member.setFlight(req.body.newFlight);

		try {
			await member.saveExtraMemberInformation(req.mysqlx, req.account);

			req.memberUpdateEmitter.emit('memberChange', {
				member: member.getReference(),
				account: req.account.toRaw()
			});
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save flight information for member'
			});
		}

		return right(void 0);
	}
);
