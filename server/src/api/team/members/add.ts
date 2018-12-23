import { Response } from 'express';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import Team from '../../../lib/Team';
import { asyncErrorHandler, getFullSchemaValidator } from '../../../lib/Util';

const validator = getFullSchemaValidator<TeamMember>('TeamMember');

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: Response) => {
	let team: Team;

	if (!validator(req.body)) {
		res.status(400);
		res.end();
		return;
	}

	try {
		team = await Team.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	team.addTeamMember(req.body.reference, req.body.job);

	try {
		await team.save();
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
})