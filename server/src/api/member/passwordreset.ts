import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	asyncRight,
	Either,
	errorGenerator,
	PasswordSetResult,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.PasswordReset> = PAM.RequireSessionType(
	// tslint:disable-next-line:no-bitwise
	SessionType.REGULAR | SessionType.PASSWORD_RESET
)(request =>
	asyncRight(request, errorGenerator('Could not reset password for user'))
		.map(req =>
			PAM.addPasswordForUser(req.mysqlx, req.session.userAccount.username, req.body.password)
		)
		.flatMap<PasswordSetResult>(result => {
			if (request.session.type === SessionType.PASSWORD_RESET) {
				return PAM.setSessionType(request.mysqlx, request.session, SessionType.REGULAR).map(
					always(result)
				);
			} else {
				return Either.right(result);
			}
		})
);

export default func;
