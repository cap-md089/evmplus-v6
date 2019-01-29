import { Response } from 'express';
import { TeamPublicity } from '../../enums';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import {
	asyncErrorHandler,
	streamAsyncGeneratorAsJSONArrayTyped
} from '../../lib/Util';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: Response) => {
		const memRef: MemberReference = !req.member
			? { type: 'Null' }
			: req.member.getReference();

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
	}
);
