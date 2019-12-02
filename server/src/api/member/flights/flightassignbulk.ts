import { right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	FlightAssignBulk,
	resolveReference
} from '../../../lib/internals';
import saveServerError from '../../../lib/saveServerError';

export default asyncEitherHandler(async (req: BasicMemberValidatedRequest<FlightAssignBulk>) => {
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

		member.setFlight(request.newFlight);

		try {
			await member.saveExtraMemberInformation(req.mysqlx, req.account);
		} catch (e) {
			saveServerError(e, req);
		}
	}

	return right(void 0);
});
