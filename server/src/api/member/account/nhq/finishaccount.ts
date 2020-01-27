import {
	addUserAccount,
	asyncErrorHandler,
	BasicValidatedRequest,
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

export default asyncErrorHandler(async (req: BasicValidatedRequest<RequestParameters>, res) => {
	let memberReference;
	try {
		memberReference = await validateUserAccountCreationToken(req.mysqlx, req.body.token);
	} catch (e) {
		res.status(400);
		return res.json({
			error: 'Could not find token'
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
			res.status(400);
			res.json({
				error: e.message
			});
		} else {
			res.status(500);
			res.end();
		}
		return;
	}

	const session = (
		await createSessionForUser(req.mysqlx, account)
			.toSome()
			.maybe()
	).some();

	res.json({
		error: 'none',
		sessionID: session.sessionID
	});
});
