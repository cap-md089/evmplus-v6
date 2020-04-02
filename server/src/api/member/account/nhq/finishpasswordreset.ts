import { api, asyncLeft, asyncRight, MemberCreateError, none, PasswordSetResult } from 'common-lib';
import Account from '../../../../lib/Account';
import {
	addPasswordForUser,
	createSessionForUser,
	getInformationForUser,
	removePasswordValidationToken,
	Session,
	validatePasswordResetToken,
	Validator
} from '../../../../lib/internals';
import { asyncEitherHandler2, serverErrorGenerator } from '../../../../lib/Util';

interface CAPNHQPasswordResetRequest {
	token: string;
	newPassword: string;
}

const passwordResetFinishValidator = new Validator<CAPNHQPasswordResetRequest>({
	token: {
		validator: Validator.String
	},
	newPassword: {
		validator: Validator.String
	}
});

// Most of these errors should not occur. If SERVER_ERROR, UNKNOWN_SERVER_ERROR,
// or DATABASE_ERROR occurs, the message is valid; if INCORRECT_CREDENTIALS,
// PASSWORD_EXPIRED, or INVALID_SESSION_ID happens when resetting the password
// there is an unknown error
const memberCreateErrorMessages = {
	[MemberCreateError.NONE]: '',
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'There was an unknown server error',
	[MemberCreateError.SERVER_ERROR]: 'There was an unknown server error',
	[MemberCreateError.PASSWORD_EXPIRED]: 'There was an unknown server error',
	[MemberCreateError.INVALID_SESSION_ID]: 'There was an unknown server error',
	[MemberCreateError.UNKOWN_SERVER_ERROR]: 'There was an unknown server error',
	[MemberCreateError.DATABASE_ERROR]: 'There was an unknown server error',
	[MemberCreateError.RECAPTCHA_INVALID]: 'Invalid reCAPTCHA'
};

const passwordResetErrorMessages = {
	[PasswordSetResult.COMPLEXITY]: 'Password fails to meet complexity requirements',
	[PasswordSetResult.IN_HISTORY]: 'Password has been used too recently',
	[PasswordSetResult.MIN_AGE]: 'Password is not old enough to change',
	[PasswordSetResult.OK]: '',
	[PasswordSetResult.SERVER_ERROR]: 'There was an error with the server'
};

export default asyncEitherHandler2<api.member.account.cap.FinishPasswordReset>(r =>
	asyncRight(r, serverErrorGenerator('Could not request username'))
		.flatMap(Account.RequestTransformer)
		.flatMap(req => passwordResetFinishValidator.transform(req))
		.flatMap(req =>
			validatePasswordResetToken(req.mysqlx, req.body.token)
				.flatMap(username =>
					asyncRight(
						addPasswordForUser(req.mysqlx, username, req.body.newPassword),
						serverErrorGenerator('Could not add new password')
					).flatMap<string>(setResult =>
						setResult === PasswordSetResult.OK
							? asyncRight(
									username,
									serverErrorGenerator('Could not create new session for user')
							  )
							: asyncLeft({
									code: 400,
									message: passwordResetErrorMessages[setResult],
									error: none<Error>()
							  })
					)
				)
				.flatMap(username =>
					removePasswordValidationToken(req.mysqlx, req.body.token).map(() => username)
				)
				.map(username => getInformationForUser(req.mysqlx, username))
				.map(account =>
					createSessionForUser(req.mysqlx, account).cata(
						memberError =>
							asyncLeft<api.ServerError, Session>({
								error: none<Error>(),
								code: 400,
								message: memberCreateErrorMessages[memberError]
							}),
						session =>
							asyncRight(session, serverErrorGenerator('Could not get session'))
					)
				)
				.flatMap(i => i)
		)
		.map(session => ({
			sessionID: session.id
		}))
);
