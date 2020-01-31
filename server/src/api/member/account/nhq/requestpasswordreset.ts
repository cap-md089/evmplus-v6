import { api, asyncLeft, asyncRight, none } from 'common-lib';
import Account from '../../../../lib/Account';
import {
	BasicSimpleValidatedRequest,
	createPasswordResetToken,
	getEmail,
	getInformationForUser,
	Registry,
	resolveReferenceE,
	Validator,
	verifyCaptcha
} from '../../../../lib/internals';
import { asyncEitherHandler2, sendEmail, serverErrorGenerator } from '../../../../lib/Util';

const identity = <T>(a: T): T => a;

interface CAPNHQPasswordResetRequest {
	username: string;
	captchaToken: string;
}

const requestPasswordResetValidator = new Validator<CAPNHQPasswordResetRequest>({
	username: {
		validator: Validator.String
	},
	captchaToken: {
		validator: Validator.String
	}
});

export default (emailFunction = sendEmail) =>
	asyncEitherHandler2<api.member.account.cap.PasswordResetRequest>(r =>
		asyncRight(r, serverErrorGenerator('Could not request username'))
			.flatMap(Account.RequestTransformer)
			.flatMap(requestPasswordResetValidator.transform)
			.flatMap(req =>
				asyncRight(
					verifyCaptcha(req.body.captchaToken),
					serverErrorGenerator('Could not verify CAPTCHA token')
				).flatMap<BasicSimpleValidatedRequest<CAPNHQPasswordResetRequest>>(success =>
					success
						? asyncRight(
								req,
								serverErrorGenerator('Could not get password reset token')
						  )
						: asyncLeft({
								error: none<Error>(),
								code: 400,
								message: 'Could not verify CAPTCHA'
						  })
				)
			)
			.flatMap(req =>
				asyncRight(
					getInformationForUser(req.mysqlx, req.body.username),
					serverErrorGenerator('Could not get member information')
				).flatMap(account =>
					asyncRight(
						Registry.Get(req.account, req.mysqlx),
						serverErrorGenerator('Could not load website configuration')
					).flatMap(registry =>
						createPasswordResetToken(req.mysqlx, account.username)
							.map(
								token =>
									`https://${req.account.id}.capunit.com/finishpasswordreset/${token}`
							)
							.flatMap(resetUrl =>
								resolveReferenceE(account.member, req.account, req.mysqlx).flatMap(
									member =>
										asyncRight(
											emailFunction(true),
											serverErrorGenerator('Could not send email')
										)
											.map(sender => sender(registry))
											.map(sender =>
												sender(`Password reset for ${member.getFullName()}`)
											)
											.flatMap(sender =>
												getEmail(member)
													.map(sender)
													.map(s =>
														s(
															`We have detected that a password reset was requested for you, ${member.getFullName()}. ` +
																`If you did not request this action, you can safely ignore this email. ` +
																`<a href="${resetUrl}">Go here</a> to reset your password. ` +
																`This link will expire within 24 hours.`
														)
													)
													.map(s =>
														s(
															`We have detected that a password reset was requested for you, ${member.getFullName()}. ` +
																`If you did not request this action, you can safely ignore this email. ` +
																`This link will expire within 24 hours.\n\nLink: ${resetUrl}`
														)
													)
													.cata(
														() =>
															asyncLeft<api.ServerError, void>({
																code: 400,
																error: none<Error>(),
																message:
																	'Could not find an email for the specified user'
															}),
														identity
													)
											)
								)
							)
					)
				)
			)
	);
