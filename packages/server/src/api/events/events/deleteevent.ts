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
import { api, canFullyManageEvent, SessionType } from 'common-lib';
import { deleteEvent, getEvent, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Delete> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.filter(canFullyManageEvent(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot perform that action',
		})
		.flatMap(deleteEvent(req.configuration)(req.mysqlx)(req.account)),
);

export default func;
