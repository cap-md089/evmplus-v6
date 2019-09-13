import { FullTeamObject } from 'common-lib';
import { Response } from 'express';
import { asyncErrorHandler, json, MemberRequest, Team } from '../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	const newTeam = await Team.Create(req.body, req.account, req.mysqlx);

	json<FullTeamObject>(res, newTeam.toFullRaw(req.member));
});
