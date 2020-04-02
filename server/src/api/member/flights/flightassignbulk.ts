import { api, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	FlightAssignBulk,
	resolveReference
} from '../../../lib/internals';
import saveServerError from '../../../lib/saveServerError';

export default asyncEitherHandler<api.member.flights.AssignBulk>(
	async (req: BasicMemberValidatedRequest<FlightAssignBulk>) => {
		for (const request of req.body.members) {
			let member;
			try {
				member = await resolveReference(request.member, req.account, req.mysqlx);
			} catch (e) {
				continue;
			}

			if (member == null) {
				continue;
			}

			if (request.newFlight === null) {
				continue;
			}

			if (request.newFlight === member.flight) {
				continue;
			}

			member.setFlight(request.newFlight);

			try {
				await member.saveExtraMemberInformation(req.mysqlx, req.account);

				req.memberUpdateEmitter.emit('memberChange', {
					member: member.getReference(),
					account: req.account.toRaw()
				});
			} catch (e) {
				saveServerError(e, req);
			}
		}

		return right(void 0);
	}
);
