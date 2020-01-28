import {
	api,
	asyncLeft,
	asyncRight,
	EitherObj,
	just,
	Maybe,
	none,
	UserAccountInformation
} from 'common-lib';
import Account from '../../../../lib/Account';
import {
	BasicSimpleValidatedRequest,
	getInformationForMember,
	Validator,
	verifyCaptcha
} from '../../../../lib/internals';
import { asyncEitherHandler2, serverErrorGenerator } from '../../../../lib/Util';

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

export default asyncEitherHandler2<EitherObj<api.ServerError, void>>(r =>
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
		.map<Maybe<UserAccountInformation>>(async req => {
			try {
				return just(
					await getInformationForMember(req.mysqlx, {
						type: 'CAPNHQMember',
						id: req.body.capid
					})
				);
			} catch (e) {
				// Return a maybe so that an error isn't thrown on a username not found
				return none<UserAccountInformation>();
			}
		}, serverErrorGenerator('Could not get member information'))
		.map(userInfo => userInfo.map(info => info.username))
		// Need to send username in email
		.tap(username => username.cata(() => console.log('No username found'), console.log))
		.map(() => void 0)
);
