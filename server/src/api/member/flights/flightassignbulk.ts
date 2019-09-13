import { resolveReference } from "../../../lib/Members";
import { asyncErrorHandler } from "../../../lib/Util";
import { MemberValidatedRequest } from "../../../lib/validator/Validator";
import { FlightAssignBulk } from "../../../lib/validator/validators/FlightAssignBulkValidator";

export default asyncErrorHandler(async (req: MemberValidatedRequest<FlightAssignBulk>, res) => {
	for (const request of req.body.members) {
		const member = await resolveReference(request.member, req.account, req.mysqlx);

		if (member == null) {
			res.status(404);
			return res.end();
		}

		member.setFlight(request.newFlight);

		await member.saveExtraMemberInformation(req.mysqlx, req.account);

		res.status(201);
		res.end();
	}
});