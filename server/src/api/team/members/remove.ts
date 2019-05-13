import { NewTeamMember } from 'common-lib';
import { Response } from 'express';
import Team from '../../../lib/Team';
import { asyncErrorHandler } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewTeamMember, { id: string }>, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		await team.removeTeamMember(req.body.reference, req.account, req.mysqlx);

		await team.save();

		res.status(204);
		res.end();
	}
);
