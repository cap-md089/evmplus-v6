import { ServerAPIEndpoint } from 'auto-client-api';
import {
	AccountType,
	api,
	asyncLeft,
	asyncRight,
	errorGenerator,
	RawCAPWingAccountObject,
	ServerError,
	SessionType,
} from 'common-lib';
import { createCAPEventAccountFunc, PAM } from 'server-common';

export const func: (
	now?: typeof Date.now
) => ServerAPIEndpoint<api.events.accounts.AddEventAccount> = (now = Date.now) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(req.account, errorGenerator('Could not create Account'))
			.flatMap<RawCAPWingAccountObject>(account =>
				account.type === AccountType.CAPWING
					? asyncRight<ServerError, RawCAPWingAccountObject>(
							account,
							errorGenerator('Could not create Account')
					  )
					: asyncLeft({
							type: 'OTHER',
							code: 400,
							message: 'Parent Account must be a Wing account',
					  })
			)
			.flatMap(parentAccount =>
				createCAPEventAccountFunc(now)(req.configuration)(req.mysqlxSession)(req.mysqlx)(
					parentAccount
				)(req.member)(req.body.accountID)(req.body.accountName)(req.body.event)
			)
	);

export default func();
