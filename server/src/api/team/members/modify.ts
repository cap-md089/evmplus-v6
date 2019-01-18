import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Team from '../../../lib/Team';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewTeamMember>, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		team.modifyTeamMember(req.body.reference, req.body.job);

		await team.save();

		res.status(204);
		res.end();
	}
);
