import { left, none, right, TeamPublicity } from 'common-lib';
import { asyncEitherHandler, BasicConditionalMemberRequest, Team } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicConditionalMemberRequest<{ id: string }>) => {
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

	if (team.visibility === TeamPublicity.PRIVATE) {
		if (req.member && team.isMemberOrLeader(req.member.getReference())) {
			return right(team.toFullRaw(req.member));
		} else {
			return left({
				code: 403,
				error: none<Error>(),
				message: 'Member does not have permission to perform that action'
			});
		}
	} else {
		return right(team.toFullRaw(req.member));
	}
});
