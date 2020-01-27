import { api, asyncRight, EitherObj } from 'common-lib';
import Account from '../../../../lib/Account';
import { getInformationForMember, Validator } from '../../../../lib/internals';
import { asyncEitherHandler2, serverErrorGenerator } from '../../../../lib/Util';

interface CAPNHQUsernameRequest {
	capid: number;
}

const usernameRequestValidator = new Validator<CAPNHQUsernameRequest>({
	capid: {
		validator: Validator.Number
	}
});

export default asyncEitherHandler2<EitherObj<api.ServerError, void>>(r =>
	asyncRight(r, serverErrorGenerator('Could not request username'))
		.flatMap(Account.RequestTransformer)
		.flatMap(req => usernameRequestValidator.transform(req))
		.map(
			req =>
				getInformationForMember(req.mysqlx, { type: 'CAPNHQMember', id: req.body.capid }),
			serverErrorGenerator('Could not get member information')
		)
		.map(userInfo => userInfo.username)
		// Need to send username in email
		.tap(username => console.log(username))
		.map(() => void 0)
);
