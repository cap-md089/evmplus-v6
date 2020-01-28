import { api, asyncLeft, asyncRight, none } from 'common-lib';
import Account from '../../../../lib/Account';
import {
	BasicSimpleValidatedRequest,
	createPasswordResetToken,
	getInformationForUser,
	Validator,
	verifyCaptcha
} from '../../../../lib/internals';
import { asyncEitherHandler2, serverErrorGenerator } from '../../../../lib/Util';

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

export default asyncEitherHandler2<api.member.account.cap.PasswordResetRequest>(r =>
	asyncRight(r, serverErrorGenerator('Could not request username'))
		.flatMap(Account.RequestTransformer)
		.flatMap(req => requestPasswordResetValidator.transform(req))
		.flatMap(req =>
			asyncRight(
				verifyCaptcha(req.body.captchaToken),
				serverErrorGenerator('Could not verify CAPTCHA token')
			).flatMap<BasicSimpleValidatedRequest<CAPNHQPasswordResetRequest>>(success =>
				success
					? asyncRight(req, serverErrorGenerator('Could not verify token'))
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
			).flatMap(account => createPasswordResetToken(req.mysqlx, account.username))
		)
		// Need to send password reset link in email
		.tap(token => console.log(token))
		.map(() => void 0)
);
