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
	asyncIterHandler,
	canFullyManageEvent,
	errorGenerator,
	Maybe,
	SessionType,
} from 'common-lib';
import { ensureResolvedEvent, getAttendanceForEvent, getEvent, PAM } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.events.attendance.GetAttendance> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.flatMap(ensureResolvedEvent(req.mysqlx))
		.filter(event => !event.privateAttendance || canFullyManageEvent(req.member)(event), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot view private attendance',
		})
		.flatMap(getAttendanceForEvent(req.mysqlx)(Maybe.some(req.account)))
		.map(asyncIterHandler(errorGenerator('Could not get attendance records for event')))
		.map(wrapper),
);

export default func;
