import {
	api,
	asyncJust,
	asyncLeft,
	asyncRight,
	EitherObj,
	none,
	UserAccountInformation
} from 'common-lib';
import Account from '../../../../lib/Account';
import {
	BasicSimpleValidatedRequest,
	getEmail,
	getInformationForMember,
	MemberClasses,
	Registry,
	resolveReferenceE,
	Validator,
	verifyCaptcha
} from '../../../../lib/internals';
import { asyncEitherHandler2, sendEmail, serverErrorGenerator } from '../../../../lib/Util';

interface CAPNHQUsernameRequest {
	capid: number;
	captchaToken: string;
}

const usernameRequestValidator = new Validator<CAPNHQUsernameRequest>({
	capid: {
		validator: Validator.Number
	},
	captchaToken: {
		validator: Validator.String
	}
});

const htmlEmailBody = (memberInfo: MemberClasses, accountInfo: UserAccountInformation) =>
	`${memberInfo.getFullName()}, your login is ${accountInfo.username}.<br />
Please respond to this email if you have questions regarding your CAPUnit.com account.`;

const textEmailBody = (memberInfo: MemberClasses, accountInfo: UserAccountInformation) =>
	`${memberInfo.getFullName()}, your login is ${accountInfo.username}.
Please respond to this email if you have questions regarding your CAPUnit.com account.`;

export default (emailFunction = sendEmail) =>
	asyncEitherHandler2<EitherObj<api.ServerError, void>>(r =>
		asyncRight(r, serverErrorGenerator('Could not request username'))
			.flatMap(Account.RequestTransformer)
			.flatMap(req => usernameRequestValidator.transform(req))
			.flatMap(req =>
				asyncRight(
					verifyCaptcha(req.body.captchaToken),
					serverErrorGenerator('Could not verify CAPTCHA token')
				).flatMap<BasicSimpleValidatedRequest<CAPNHQUsernameRequest>>(success =>
					success
						? asyncRight(req, serverErrorGenerator('Could not verify token'))
						: asyncLeft({
								error: none<Error>(),
								code: 400,
								message: 'Could not verify CAPTCHA'
						  })
				)
			)
			.map(req =>
				asyncJust(
					getInformationForMember(req.mysqlx, {
						type: 'CAPNHQMember',
						id: req.body.capid
					})
				)
					.map(info =>
						resolveReferenceE(
							{ type: 'CAPNHQMember', id: req.body.capid },
							req.account,
							req.mysqlx
						).flatMap(member =>
							getEmail(member)
								.map(email =>
									asyncRight(
										Registry.Get(req.account, req.mysqlx),
										serverErrorGenerator('Could not get site configuration')
									)
										.map(registry => emailFunction(true)(registry))
										.map(emailer => emailer('Username request')(email))
										.map(emailer => emailer(htmlEmailBody(member, info)))
										.flatMap(emailer => emailer(textEmailBody(member, info)))
								)
								.orSome(
									asyncLeft({
										code: 400,
										message:
											'There is no email address associated with the account requested',
										error: none<Error>()
									})
								)
						)
					)
					.cata(
						() => asyncRight(void 0, serverErrorGenerator('Could not send username')),
						eith => eith
					)
			)
			.flatMap(i => i)
	);
