import { api, just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Team } from '../../lib/internals';

export default asyncEitherHandler<api.team.Delete>(
	async (req: BasicMemberRequest<{ id: string }>) => {
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

		try {
			await team.delete();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not delete team'
			});
		}

		return right(void 0);
	}
);
