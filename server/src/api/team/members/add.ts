import { api, just, left, none, RawTeamMember, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	resolveReference,
	Team
} from '../../../lib/internals';

export default asyncEitherHandler<api.team.members.Add>(
	async (req: BasicMemberValidatedRequest<RawTeamMember, { id: string }>) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find team'
			});
		}

		let fullMember;

		try {
			fullMember = await resolveReference(req.body.reference, req.account, req.mysqlx, true);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find member specified'
			});
		}

		try {
			await team.addTeamMember(fullMember, req.body.job, req.account, req.mysqlx);

			await team.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save team information'
			});
		}

		return right(void 0);
	}
);
