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

import { validator } from 'auto-client-api';
import { api, canManageEvent, NewEventObject, SessionType, Validator } from 'common-lib';
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
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const partialEventValidator = Validator.Partial(
	(validator<NewEventObject>(Validator) as Validator<NewEventObject>).rules,
);

export const func: Endpoint<
	Backends<[AccountBackend, EventsBackend]>,
	api.events.events.Set
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(partialEventValidator)(request).flatMap(req =>
			backend
				.getEvent(req.account)(req.params.id)
				.flatMap(backend.ensureResolvedEvent)
				.filter(canManageEvent(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to perform that action',
				})
				.map(event => ({
					...event,
					...req.body,
					status: canManageEvent(req.member)(event)
						? req.body.status ?? event.status
						: event.status,
				}))
				.flatMap(backend.saveEvent(req.member))
				.flatMap(backend.getFullEventObject)
				.map(wrapper),
		),
	);

export default withBackends(func, getAccountBackend, getEventsBackend);
