import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncRight, errorGenerator } from 'common-lib';
import { PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.account.FinishAccountSetup> = req =>
	asyncRight(
		PAM.validateUserAccountCreationToken(req.mysqlx, req.body.token),
		errorGenerator('Could not find token')
	)
		.map(
			member =>
				PAM.addUserAccount(
					req.mysqlx,
					req.account,
					req.body.username,
					req.body.password,
					member,
					req.body.token
				),
			error =>
				error instanceof PAM.UserError
					? {
							type: 'OTHER',
							code: 400,
							message: error.message,
					  }
					: {
							type: 'CRASH',
							code: 500,
							error,
							message:
								'An unknown error occurred while trying to finish creating your account',
					  }
		)
		.flatMap(account => PAM.createSessionForUser(req.mysqlx, account))
		.map(({ id }) => ({ sessionID: id }));

export default func;
