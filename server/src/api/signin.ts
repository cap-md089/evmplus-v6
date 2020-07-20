import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	AccountLinkTarget,
	api,
	AsyncEither,
	asyncIterFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	ExpiredSuccessfulSigninReturn,
	FailedSigninReturn,
	get,
	MemberCreateError,
	Right,
	ServerError,
	SuccessfulSigninReturn,
	toReference,
} from 'common-lib';
import {
	getAdminAccountIDsForMember,
	getUnfinishedTaskCountForMember,
	getUnreadNotificationCount,
	PAM,
	resolveReference,
	ServerEither,
} from 'server-common';
import { getPermissionsForMemberInAccountDefault } from 'server-common/dist/member/pam';

const handleSuccess = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninSuccess
): ServerEither<SuccessfulSigninReturn> => {
	return AsyncEither.All([
		resolveReference(req.mysqlx)(req.account)(result.member),
		asyncRight(
			getPermissionsForMemberInAccountDefault(req.mysqlx, result.member, req.account),
			errorGenerator('Could not get permissions for member')
		),
		getUnreadNotificationCount(req.mysqlx)(req.account)(result.member),
		getUnfinishedTaskCountForMember(req.mysqlx)(req.account)(result.member),
		asyncRight<ServerError, AccountLinkTarget[]>(
			collectGeneratorAsync(
				asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
					asyncIterFilter<
						EitherObj<ServerError, AccountLinkTarget>,
						Right<AccountLinkTarget>
					>(Either.isRight)(
						getAdminAccountIDsForMember(req.mysqlx)(toReference(result.member))
					)
				)
			),
			errorGenerator('Could not get admin account IDs for member')
		),
	]).map(([member, permissions, notificationCount, taskCount, linkableAccounts]) => ({
		error: MemberCreateError.NONE,
		member: {
			...member,
			sessionID: result.sessionID,
			permissions,
		},
		sessionID: result.sessionID,
		notificationCount,
		taskCount,
		linkableAccounts: linkableAccounts.filter(({ id }) => id !== req.account.id),
	}));
};

const handlePasswordExpired = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninPasswordOld
): ServerEither<ExpiredSuccessfulSigninReturn> =>
	asyncRight<ServerError, ExpiredSuccessfulSigninReturn>(
		{
			error: MemberCreateError.PASSWORD_EXPIRED,
			sessionID: result.sessionID,
		},
		errorGenerator('Could not handle failure')
	);

const handleFailure = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninFailed
): ServerEither<FailedSigninReturn> =>
	result.result === MemberCreateError.SERVER_ERROR ||
	result.result === MemberCreateError.UNKOWN_SERVER_ERROR
		? asyncLeft({
				type: 'OTHER',
				code: 500,
				message: 'Unknown error occurred',
		  })
		: asyncRight<ServerError, FailedSigninReturn>(
				{
					error: result.result,
				},
				errorGenerator('Could not handle failure')
		  );

export const func: ServerAPIEndpoint<api.Signin> = req => {
	return asyncRight(
		PAM.trySignin(
			req.mysqlx,
			req.body.username,
			req.body.password,
			req.body.recaptcha,
			req.configuration
		),
		errorGenerator('Could not sign in')
	).flatMap<SuccessfulSigninReturn | FailedSigninReturn | ExpiredSuccessfulSigninReturn>(
		results =>
			results.result === MemberCreateError.NONE
				? handleSuccess(req)(results)
				: results.result === MemberCreateError.PASSWORD_EXPIRED
				? handlePasswordExpired(req)(results)
				: handleFailure(req)(results)
	);
};

export default func;
