import { Response } from 'express';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { asyncErrorHandler, json } from '../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: Response) => {
	let team: Team;

	try {
		team = await Team.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	json<FullTeamObject>(res, team.toFullRaw(req.member));
});
