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
	AccountObject,
	always,
	api,
	AsyncEither,
	EventType,
	FromDatabase,
	hasBasicEventPermissions,
	RawRegularEventObject,
	RawResolvedEventObject,
	toReference,
	User,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	GenBackend,
	getCombinedEventsBackend,
	getCombinedMemberBackend,
	MemberBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[AccountBackend, EventsBackend, PAM.PAMBackend]>,
	api.events.events.Link
> = backend => req =>
	AsyncEither.All([
		backend.getEvent(req.account)(req.params.eventid),
		backend.getAccount(req.params.targetaccount),
	])
		.filter(([event]) => event.type === EventType.REGULAR, {
			type: 'OTHER',
			code: 400,
			message: 'You cannot link to a linked event',
		})
		.flatMap(([event, targetAccount]: [FromDatabase<RawRegularEventObject>, AccountObject]) =>
			backend
				.getPermissionsForMemberInAccount(targetAccount)(req.member)
				.map(PAM.getDefaultPermissions(req.account))
				.map<User>(permissions => ({ ...req.member, permissions }))
				.filter(hasBasicEventPermissions, {
					type: 'OTHER',
					code: 403,
					message:
						'Member does not have permission to perform this action in the specified account',
				})
				.map(always(targetAccount))
				.flatMap(backend.linkEvent(event)(toReference(req.member)))
				.map(
					linkedEvent =>
						({
							...event,
							...linkedEvent,
						} as FromDatabase<RawResolvedEventObject>),
				),
		)
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<ReturnType<typeof getCombinedEventsBackend>>, MemberBackend, PAM.PAMBackend]
	>(getCombinedEventsBackend(), getCombinedMemberBackend(), PAM.getPAMBackend),
);
