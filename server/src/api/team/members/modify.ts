import { NewTeamMember } from 'common-lib';
import { Response } from 'express';
import Team from '../../../lib/Team';
import { asyncErrorHandler } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

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
