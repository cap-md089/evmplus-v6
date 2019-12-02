import { AbsenteeInformation, just, left, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberValidatedRequest } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberValidatedRequest<AbsenteeInformation>) => {
	req.member.setAbsenteeInformation(req.body);

	try {
		await req.member.saveExtraMemberInformation(req.mysqlx, req.account);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not save absentee information'
		});
	}

	return right(void 0);
});
