import type { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';

export const getFormToken: ServerAPIEndpoint<api.FormToken> = PAM.RequireSessionType(
	// tslint:disable-next-line:no-bitwise
	SessionType.REGULAR | SessionType.SCAN_ADD | SessionType.PASSWORD_RESET
)(req =>
	asyncRight(
		PAM.getTokenForUser(req.mysqlx, req.session.userAccount),
		errorGenerator('Could not get form token')
	)
);

export function tokenTransformer<T extends PAM.BasicMemberRequest>(
	req: T
): AsyncEither<ServerError, T> {
	return asyncRight(
		PAM.isTokenValid(req.mysqlx, req.member, req.body.token),
		errorGenerator('Could not validate token')
	).flatMap(valid =>
		valid
			? asyncRight(req, errorGenerator('Could not validate token'))
			: asyncLeft({
					type: 'OTHER',
					code: 403,
					message: 'Could not validate token',
			  })
	);
}
