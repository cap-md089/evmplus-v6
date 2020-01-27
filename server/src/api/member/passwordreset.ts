import { api, just, left, none, PasswordSetResult, right } from 'common-lib';
import {
	addPasswordForUser,
	asyncEitherHandler,
	BasicMemberRequest,
	unmarkSessionForPasswordReset
} from '../../lib/internals';

const passwordResetErrorMessages = {
	[PasswordSetResult.COMPLEXITY]: 'Password fails to meet complexity requirements',
	[PasswordSetResult.IN_HISTORY]: 'Password has been used too recently',
	[PasswordSetResult.MIN_AGE]: 'Password is not old enough to change',
	[PasswordSetResult.OK]: '',
	[PasswordSetResult.SERVER_ERROR]: 'There was an error with the server'
};

export default asyncEitherHandler<api.member.PasswordReset>(async (req: BasicMemberRequest) => {
	if (typeof req.body.password !== 'string') {
		return left({
			code: 400,
			error: none<Error>(),
			message: 'New password is not a string'
		});
	}

	try {
		const result = await addPasswordForUser(req.mysqlx, req.member.username, req.body.password);

		if (result !== PasswordSetResult.OK) {
			return left({
				code: 400,
				error: none<Error>(),
				message: passwordResetErrorMessages[result]
			});
		}

		if (req.member.session.passwordOnly) {
			await unmarkSessionForPasswordReset(req.mysqlx, req.member.session).fullJoin();
		}

		return right(void 0);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Unknown server error'
		});
	}
});
