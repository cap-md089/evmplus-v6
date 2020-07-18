import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	asyncRight,
	errorGenerator,
	isRioux,
	Maybe,
	MemberCreateError,
	ServerError,
	SigninReturn,
	User,
} from 'common-lib';
import {
	Admin,
	getUnfinishedTaskCountForMember,
	getUnreadNotificationCount,
	ServerEither,
} from 'server-common';

export const func: ServerAPIEndpoint<api.Check> = req =>
	Maybe.cata<User, ServerEither<SigninReturn>>(
		always(
			asyncRight<ServerError, SigninReturn>(
				{
					error: MemberCreateError.INVALID_SESSION_ID,
				},
				errorGenerator('What?')
			)
		)
	)(user =>
		AsyncEither.All([
			getUnreadNotificationCount(req.mysqlx)(req.account)(user),
			getUnfinishedTaskCountForMember(req.mysqlx)(req.account)(user),
		]).map(([notificationCount, taskCount]) => ({
			error: MemberCreateError.NONE,
			sessionID: user.sessionID,
			member: isRioux(user) ? { ...user, permissions: Admin } : user,
			notificationCount,
			taskCount,
		}))
	)(req.member);

export default func;
