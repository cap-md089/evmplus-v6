import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Team from '../../lib/Team';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<Partial<RawTeamObject>>, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		team.set(req.body);

		await team.updateMembers(
			team.members.slice(),
			req.body.members,
			req.account,
			req.mysqlx
		);

		await team.save();

		res.status(204);
		res.end();
	}
);
