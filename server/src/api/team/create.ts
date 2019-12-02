import { just, left, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Team } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest) => {
	try {
		const newTeam = await Team.Create(req.body, req.account, req.mysqlx);

		return right(newTeam.toFullRaw(req.member));
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not create team'
		});
	}
});
