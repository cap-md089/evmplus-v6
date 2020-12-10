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
	api,
	asyncRight,
	canFullyManageEvent,
	errorGenerator,
	EventStatus,
	Maybe,
	SessionType,
	toReference,
} from 'common-lib';
import { copyEvent, getEvent, getFullEventObject, PAM } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.events.events.Copy> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	asyncRight(req, errorGenerator('Could not get information')).flatMap(() =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.filter(canFullyManageEvent(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to perform that action',
			})
			.map(copyEvent(req.configuration)(req.mysqlx)(req.account))
			.map(copier => copier(toReference(req.member)))
			.map(copier => copier(req.body.newTime))
			.map(copier =>
				copier(
					Maybe.orSome(EventStatus.INFORMATIONONLY)(Maybe.fromValue(req.body.newStatus)),
				),
			)
			.flatMap(copier => copier(!!req.body.copyFiles))
			.flatMap(
				getFullEventObject(req.mysqlx)(req.account)(Maybe.none())(Maybe.some(req.member))(
					false,
				),
			)
			.map(wrapper),
	),
);

export default func;
