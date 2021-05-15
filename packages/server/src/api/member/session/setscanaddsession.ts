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

import { api, canFullyManageEvent, SessionType } from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	getCombinedEventsBackend,
	getCombinedPAMBackend,
	getTimeBackend,
	PAM,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';

export const func: Endpoint<
	Backends<[EventsBackend, TimeBackend, PAM.PAMBackend]>,
	api.member.session.SetScanAddSession
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.body.eventID)
			.flatMap(backend.ensureResolvedEvent)
			.filter(canFullyManageEvent(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to manage this event',
			})
			.filter(event => event.pickupDateTime > backend.now(), {
				type: 'OTHER',
				code: 403,
				message: 'You cannot record attendance for this event after it has ended',
			})
			.flatMap(({ pickupDateTime, id }) =>
				backend.updateSession({
					expires: pickupDateTime,
					id: req.session.id,
					sessionData: {
						accountID: req.account.id,
						eventID: id,
					},
					type: SessionType.SCAN_ADD,
					userAccount: req.session.userAccount,
				}),
			)
			.map(({ expires, id }) => ({
				response: void 0,
				cookies: {
					sessionID: {
						expires,
						value: id,
					},
				},
			})),
	);

export default withBackends(
	func,
	combineBackends<BasicAccountRequest, [TimeBackend, EventsBackend, PAM.PAMBackend]>(
		getTimeBackend,
		getCombinedEventsBackend(),
		getCombinedPAMBackend(),
	),
);
