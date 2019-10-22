import {
	asyncErrorHandler,
	FlightAssign,
	MemberValidatedRequest,
	resolveReference
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberValidatedRequest<FlightAssign>, res) => {
	const member = await resolveReference(req.body.member, req.account, req.mysqlx);

	if (member == null) {
		res.status(404);
		return res.end();
	}

	if (req.body.newFlight === null) {
		res.status(400);
		return res.end();
	}

	member.setFlight(req.body.newFlight);

	await member.saveExtraMemberInformation(req.mysqlx, req.account);

	res.status(201);
	res.end();
});
