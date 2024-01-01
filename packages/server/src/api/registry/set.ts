/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { validator } from 'auto-client-api';
import { api, destroy, Permissions, RegistryValues, SessionType, Validator } from 'common-lib';
import { Backends, getRegistryBackend, PAM, RegistryBackend, withBackends } from 'server-common';
import { Endpoint } from '../..';
import { validateRequest } from '../../lib/requestUtils';
import wrapper from '../../lib/wrapper';

const partialRegistryValidator = Validator.Partial(
	(validator<RegistryValues>(Validator) as Validator<RegistryValues>).rules,
);

export const func: Endpoint<Backends<[RegistryBackend]>, api.registry.SetRegistry> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'RegistryEdit',
			Permissions.RegistryEdit.YES,
		)(request =>
			validateRequest(partialRegistryValidator)(request).flatMap(req =>
				backend
					.getRegistry(req.account)
					.map(oldRegistry => ({ ...oldRegistry, ...req.body }))
					.flatMap(backend.saveRegistry)
					.map(destroy)
					.map(wrapper),
			),
		),
	);

export default withBackends(func, getRegistryBackend);
