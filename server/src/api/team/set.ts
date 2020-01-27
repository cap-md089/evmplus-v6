import { api, just, left, none, RawTeamObject, right } from 'common-lib';
import { asyncEitherHandler, BasicPartialMemberValidatedRequest, Team } from '../../lib/internals';

export default asyncEitherHandler<api.team.Set>(
	async (req: BasicPartialMemberValidatedRequest<RawTeamObject, { id: string }>) => {
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

		team.set(req.body);

		try {
			if (req.body.members) {
				await team.updateMembers(
					team.members.slice(),
					req.body.members,
					req.account,
					req.mysqlx
				);
			}

			await team.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not update team information'
			});
		}

		return right(void 0);
	}
);
