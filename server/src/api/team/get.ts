import { Response } from 'express';
import { TeamPublicity } from '../../enums';
import { ConditionalMemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { asyncErrorHandler, json } from '../../lib/Util';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		let teamObj: FullTeamObject;

		if (team.visibility === TeamPublicity.PRIVATE) {
			if (
				req.member &&
				team.isMemberOrLeader(req.member.getReference())
			) {
				teamObj = team.toFullRaw(req.member);
			} else {
				res.status(403);
				return res.end();
			}
		} else {
			teamObj = team.toFullRaw(req.member);
		}

		json<FullTeamObject>(res, teamObj);
	}
);
