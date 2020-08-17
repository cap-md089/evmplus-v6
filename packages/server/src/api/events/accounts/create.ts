/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

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
	now?: typeof Date.now,
) => ServerAPIEndpoint<api.events.accounts.AddEventAccount> = (now = Date.now) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(req.account, errorGenerator('Could not create Account'))
			.flatMap<RawCAPWingAccountObject>(account =>
				account.type === AccountType.CAPWING
					? asyncRight<ServerError, RawCAPWingAccountObject>(
							account,
							errorGenerator('Could not create Account'),
					  )
					: asyncLeft({
							type: 'OTHER',
							code: 400,
							message: 'Parent Account must be a Wing account',
					  }),
			)
			.flatMap(parentAccount =>
				createCAPEventAccountFunc(now)(req.configuration)(req.mysqlxSession)(req.mysqlx)(
					parentAccount,
				)(req.member)(req.body.accountID)(req.body.accountName)(req.body.event),
			),
	);

export default func();
