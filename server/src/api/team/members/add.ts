import { RawTeamMember } from 'common-lib';
import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import MemberBase from '../../../lib/Members';
import Team from '../../../lib/Team';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<RawTeamMember>, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		let fullMember;

		try {
			fullMember = await MemberBase.ResolveReference(
				req.body.reference,
				req.account,
				req.mysqlx,
				true
			);
		} catch (e) {
			res.status(404);
			res.end();
		}

		team.addTeamMember(fullMember, req.body.job, req.account, req.mysqlx);

		await team.save();

		res.status(204);
		res.end();
	}
);
