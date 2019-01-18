import { Response } from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { asyncErrorHandler, json } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	const newTeam = await Team.Create(req.body, req.account, req.mysqlx);

	json<FullTeamObject>(res, newTeam.toFullRaw(req.member));
});
