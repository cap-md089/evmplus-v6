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
	api,
	asyncRight,
	canManageEvent,
	errorGenerator,
	Maybe,
	Permissions,
	SessionType,
	toReference
} from 'common-lib';
import { copyEvent, getEvent, getFullEventObject, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Copy> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncRight(req, errorGenerator('Could not get information')).flatMap(() =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.filter(canManageEvent(Permissions.ManageEvent.FULL)(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to perform that action'
			})
			.map(copyEvent(req.configuration)(req.mysqlx)(req.account))
			.map(copier => copier(toReference(req.member)))
			.map(copier => copier(req.body.newTime))
			.map(copier => copier(!!req.body.copyStatus))
			.flatMap(copier => copier(!!req.body.copyFiles))
			.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))
	)
);

export default func;
