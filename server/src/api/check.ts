import { ServerAPIEndpoint } from 'auto-client-api';
import {
	AccountLinkTarget,
	always,
	api,
	AsyncEither,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	get,
	isRioux,
	Maybe,
	MemberCreateError,
	Right,
	ServerError,
	SigninReturn,
	toReference,
	User,
} from 'common-lib';
import {
	Admin,
	getAdminAccountIDsForMember,
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
			asyncRight<ServerError, AccountLinkTarget[]>(
				collectGeneratorAsync(
					asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
						asyncIterFilter<
							EitherObj<ServerError, AccountLinkTarget>,
							Right<AccountLinkTarget>
						>(Either.isRight)(
							getAdminAccountIDsForMember(req.mysqlx)(toReference(user))
						)
					)
				),
				errorGenerator('Could not get admin account IDs for member')
			),
		]).map(([notificationCount, taskCount, linkableAccounts]) => ({
			error: MemberCreateError.NONE,
			sessionID: user.sessionID,
			member: isRioux(user) ? { ...user, permissions: Admin } : user,
			notificationCount,
			taskCount,
			linkableAccounts: linkableAccounts.filter(({ id }) => id !== req.account.id),
		}))
	)(req.member);

export default func;
