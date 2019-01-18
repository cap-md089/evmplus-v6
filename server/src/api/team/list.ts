import { Response } from 'express';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import {
	asyncErrorHandler,
	streamAsyncGeneratorAsJSONArrayTyped
} from '../../lib/Util';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: Response) => {
		await streamAsyncGeneratorAsJSONArrayTyped<Team, FullTeamObject>(
			res,
			req.account.getTeams(),
			team => team.toFullRaw(req.member)
		);
	}
);
