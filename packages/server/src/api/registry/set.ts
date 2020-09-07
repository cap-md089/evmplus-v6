/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerAPIEndpoint, validator } from 'auto-client-api';
import { api, destroy, Permissions, RegistryValues, SessionType, Validator } from 'common-lib';
import { getRegistry, PAM, saveRegistry } from 'server-common';
import { validateRequest } from '../../lib/requestUtils';

const partialRegistryValidator = Validator.Partial(
	(validator<RegistryValues>(Validator) as Validator<RegistryValues>).rules,
);

export const func: ServerAPIEndpoint<api.registry.SetRegistry> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(
	PAM.RequiresPermission(
		'RegistryEdit',
		Permissions.RegistryEdit.YES,
	)(request =>
		validateRequest(partialRegistryValidator)(request).flatMap(req =>
			getRegistry(req.mysqlx)(req.account)
				.map(oldRegistry => ({ ...oldRegistry, ...req.body }))
				.tap(console.log)
				.flatMap(saveRegistry(req.mysqlx))
				.map(destroy),
		),
	),
);

export default func;
