import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	ExpiredSuccessfulSigninReturn,
	FailedSigninReturn,
	MemberCreateError,
	ServerError,
	SuccessfulSigninReturn,
} from 'common-lib';
import {
	getUnfinishedTaskCountForMember,
	getUnreadNotificationCount,
	PAM,
	resolveReference,
	ServerEither,
} from 'server-common';
import { getPermissionsForMemberInAccountDefault } from 'server-common/dist/member/pam';

const handleSuccess = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninSuccess
): ServerEither<SuccessfulSigninReturn> =>
	AsyncEither.All([
		resolveReference(req.mysqlx)(req.account)(result.member),
		asyncRight(
			getPermissionsForMemberInAccountDefault(req.mysqlx, result.member, req.account),
			errorGenerator('Could not get permissions for member')
		),
		getUnreadNotificationCount(req.mysqlx)(req.account)(result.member),
		getUnfinishedTaskCountForMember(req.mysqlx)(req.account)(result.member),
	]).map(([member, permissions, notificationCount, taskCount]) => ({
		error: MemberCreateError.NONE,
		member: {
			...member,
			sessionID: result.sessionID,
			permissions,
		},
		sessionID: result.sessionID,
		notificationCount,
		taskCount,
	}));

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

export const func: ServerAPIEndpoint<api.Signin> = req =>
	asyncRight(
		PAM.trySignin(req.mysqlx, req.body.username, req.body.password, req.body.recaptcha),
		errorGenerator('Could not sign in as user')
	).flatMap<SuccessfulSigninReturn | FailedSigninReturn | ExpiredSuccessfulSigninReturn>(
		results =>
			results.result === MemberCreateError.NONE
				? handleSuccess(req)(results)
				: results.result === MemberCreateError.PASSWORD_EXPIRED
				? handlePasswordExpired(req)(results)
				: handleFailure(req)(results)
	);

export default func;
