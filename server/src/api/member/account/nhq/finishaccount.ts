import { api, just, left, none, right } from 'common-lib';
import {
	addUserAccount,
	asyncEitherHandler,
	BasicSimpleValidatedRequest,
	createSessionForUser,
	UserError,
	validateUserAccountCreationToken,
	Validator
} from '../../../../lib/internals';

interface RequestParameters {
	password: string;
	username: string;
	token: string;
}

export const nhqFinishValidator = new Validator<RequestParameters>({
	password: {
		validator: Validator.String
	},
	token: {
		validator: Validator.String
	},
	username: {
		validator: Validator.String
	}
});

export default asyncEitherHandler<api.member.account.cap.Finish>(
	async (req: BasicSimpleValidatedRequest<RequestParameters>) => {
		let memberReference;
		try {
			memberReference = await validateUserAccountCreationToken(req.mysqlx, req.body.token);
		} catch (e) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Could not find token'
			});
		}

		let account;
		try {
			account = await addUserAccount(
				req.mysqlx,
				req.account,
				req.body.username,
				req.body.password,
				memberReference,
				req.body.token
			);
		} catch (e) {
			if (e instanceof UserError) {
				return left({
					code: 400,
					error: none<Error>(),
					message: e.message
				});
			} else {
				return left({
					code: 500,
					error: just(e),
					message:
						'An unknown error occurred while trying to finish creating your account'
				});
			}
		}

		const session = (
			await createSessionForUser(req.mysqlx, account)
				.toSome()
				.maybe()
		).some();

		return right({
			sessionID: session.sessionID
		});
	}
);
