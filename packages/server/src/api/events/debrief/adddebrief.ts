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
import { always, api, get, RawEventObject, SessionType, toReference } from 'common-lib';
import { getEvent, PAM, saveEventFunc } from 'server-common';

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.debrief.Add> = (
	now = Date.now,
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.map<[RawEventObject, RawEventObject]>(oldEvent => [
				oldEvent,
				{
					...oldEvent,
					debrief: [
						...oldEvent.debrief,
						{
							debriefText: req.body.debriefText,
							memberRef: toReference(req.member),
							timeSubmitted: now(),
						},
					],
				},
			])
			.flatMap(([oldEvent, newEvent]) =>
				saveEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(oldEvent)(
					newEvent,
				).map(always(newEvent)),
			)
			.map(get('debrief')),
	);

export default func();
