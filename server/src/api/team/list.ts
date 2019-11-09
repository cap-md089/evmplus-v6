import { FullTeamObject, MemberReference, TeamPublicity } from 'common-lib';
import { Response } from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	streamAsyncGeneratorAsJSONArrayTyped,
	Team
} from '../../lib/internals';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: Response) => {
	const memRef: MemberReference = !req.member ? { type: 'Null' } : req.member.getReference();

	await streamAsyncGeneratorAsJSONArrayTyped<Team, FullTeamObject>(
		res,
		req.account.getTeams(),
		team => {
			if (team.visibility === TeamPublicity.PRIVATE) {
				if (team.isMemberOrLeader(memRef)) {
					return team.toFullRaw(req.member);
				} else {
					return false;
				}
			}
			return team.toFullRaw(req.member);
		}
	);
});
