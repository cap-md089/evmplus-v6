import { Response } from 'express';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default (req: ConditionalMemberRequest, res: Response) => {
	streamAsyncGeneratorAsJSONArray<Team>(res, req.account.getTeams(), team =>
		JSON.stringify(team.toRaw(req.member))
	);
};
