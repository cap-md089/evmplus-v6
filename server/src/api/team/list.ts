import { Response } from 'express';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: Response) => {
	await streamAsyncGeneratorAsJSONArray<Team>(res, req.account.getTeams(), team => {
		team.toRaw();

		return JSON.stringify(team.toRaw(req.member))
	}
	);
});
