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

import {
	api,
	asyncRight,
	effectiveManageEventPermission,
	errorGenerator,
	EventStatus,
	Permissions,
	SessionType,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	EventsBackend,
	getAccountBackend,
	getEventsBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[EventsBackend, AccountBackend]>,
	api.events.events.Add
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		asyncRight(request, errorGenerator('Could not create event'))
			.filter(
				req => effectiveManageEventPermission(req.member) !== Permissions.ManageEvent.NONE,
				{
					type: 'OTHER',
					code: 403,
					message: 'You do not have permission to do that',
				},
			)
			.map(req => ({
				...req,
				body: {
					...req.body,
					status:
						effectiveManageEventPermission(req.member) ===
						Permissions.ManageEvent.ADDDRAFTEVENTS
							? EventStatus.DRAFT
							: req.body.status,
				},
			}))
			.flatMap(req => backend.createEvent(req.account)(req.member)(req.body))
			.flatMap(backend.getFullEventObject)
			.map(wrapper),
	);

export default withBackends(func, getEventsBackend, getAccountBackend);
