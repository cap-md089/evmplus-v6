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
import {
	api,
	canManageEvent,
	FromDatabase,
	Maybe,
	NewEventObject,
	RawResolvedEventObject,
	SessionType,
	Validator,
} from 'common-lib';
import {
	ensureResolvedEvent,
	getEvent,
	getFullEventObject,
	PAM,
	saveEventFunc,
} from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const partialEventValidator = Validator.Partial(
	(validator<NewEventObject>(Validator) as Validator<NewEventObject>).rules,
);

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.events.Set> = (
	now = Date.now,
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(partialEventValidator)(request).flatMap(req =>
			getEvent(req.mysqlx)(req.account)(req.params.id)
				.flatMap(ensureResolvedEvent(req.mysqlx))
				.filter(canManageEvent(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to perform that action',
				})
				.map<[RawResolvedEventObject, FromDatabase<RawResolvedEventObject>]>(event => [
					{
						...event,
						...req.body,
						status: canManageEvent(req.member)(event)
							? req.body.status ?? event.status
							: event.status,
					},
					event,
				])
				.flatMap(([newEvent, oldEvent]) =>
					saveEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(req.member)(
						oldEvent,
					)(newEvent),
				)
				.flatMap(
					getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.account))(
						Maybe.some(req.member),
					)(false),
				)
				.map(wrapper),
		),
	);

export default func();
