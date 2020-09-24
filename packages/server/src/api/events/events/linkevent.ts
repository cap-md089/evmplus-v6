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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	AccountObject,
	always,
	api,
	AsyncEither,
	asyncRight,
	errorGenerator,
	EventType,
	hasBasicEventPermissions,
	RawRegularEventObject,
	RawResolvedEventObject,
	toReference,
	User,
} from 'common-lib';
import { getAccount, getEvent, linkEvent, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Link> = req =>
	AsyncEither.All([
		getEvent(req.mysqlx)(req.account)(req.params.eventid),
		getAccount(req.mysqlx)(req.params.targetaccount),
	])
		.filter(([event]) => event.type === EventType.REGULAR, {
			type: 'OTHER',
			code: 400,
			message: 'You cannot link to a linked event',
		})
		.flatMap(([event, targetAccount]: [RawRegularEventObject, AccountObject]) =>
			asyncRight(
				PAM.getPermissionsForMemberInAccountDefault(
					req.mysqlx,
					toReference(req.member),
					targetAccount,
				),
				errorGenerator('Could not get permissions for account'),
			)
				.map<User>(permissions => ({ ...req.member, permissions }))
				.filter(hasBasicEventPermissions, {
					type: 'OTHER',
					code: 403,
					message:
						'Member does not have permission to perform this action in the specified account',
				})
				.map(always(targetAccount))
				.flatMap(linkEvent(req.configuration)(req.mysqlx)(event)(toReference(req.member)))
				.map(
					linkedEvent =>
						({
							...event,
							...linkedEvent,
						} as RawResolvedEventObject),
				),
		);

export default func;
