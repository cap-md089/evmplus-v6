import { passwordMeetsRequirements, PasswordSetResult } from 'common-lib';
import {
	addPasswordForUser,
	asyncErrorHandler,
	MemberRequest,
	unmarkSessionForPasswordReset
} from '../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res, next) => {
	if (typeof req.body.password !== 'string' || !passwordMeetsRequirements(req.body.password)) {
		res.status(400);
		return res.end();
	}

	try {
		const result = await addPasswordForUser(req.mysqlx, req.member.username, req.body.password);

		await unmarkSessionForPasswordReset(req.mysqlx, req.member.session).fullJoin();

		res.json({
			result
		});
	} catch (e) {
		res.json({
			result: PasswordSetResult.SERVER_ERROR
		});
	}
});
