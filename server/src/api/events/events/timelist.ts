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
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	canManageEvent,
	Either,
	EitherObj,
	errorGenerator,
	EventStatus,
	get,
	Maybe,
	MaybeObj,
	Permissions,
	pipe,
	RawEventObject,
	Right,
	ServerError,
	User,
} from 'common-lib';
import { getEventsInRange } from 'server-common';

const canMaybeManageEvent = (event: RawEventObject) => (member: MaybeObj<User>) =>
	pipe(
		Maybe.map<User, (e: RawEventObject) => boolean>(
			canManageEvent(Permissions.ManageEvent.ADDDRAFTEVENTS)
		),
		Maybe.orSome<(e: RawEventObject) => boolean>(() => false)
	)(member)(event);

export const func: ServerAPIEndpoint<api.events.events.GetRange> = req =>
	asyncRight(
		[parseInt(req.params.timestart, 10), parseInt(req.params.timeend, 10)],
		errorGenerator('Could not get events in range')
	)
		.filter(([timestart, timeend]) => !isNaN(timestart) && !isNaN(timeend), {
			type: 'OTHER',
			code: 400,
			message: 'The provided range start and end are invalid',
		})
		.map(([timestart, timeend]) =>
			getEventsInRange(req.mysqlx)(req.account)(timestart)(timeend)
		)
		.map(
			asyncIterFilter<EitherObj<ServerError, RawEventObject>, Right<RawEventObject>>(
				Either.isRight
			)
		)
		.map(asyncIterMap(get('value')))
		.map(
			asyncIterFilter(
				event =>
					event.status !== EventStatus.DRAFT || canMaybeManageEvent(event)(req.member)
			)
		);

export default func;
