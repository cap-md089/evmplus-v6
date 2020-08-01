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
import { api, destroy, SessionType } from 'common-lib';
import { canSeeNotification, deleteNotification, getNotification, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.notifications.DeleteNotification> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getNotification(req.mysqlx)(req.account)(req.params.id)
		.filter(canSeeNotification(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot delete notification'
		})
		.flatMap(deleteNotification(req.mysqlx))
		.map(destroy)
);

export default func;
