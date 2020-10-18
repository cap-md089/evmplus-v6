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
import { api, destroy, SessionType } from 'common-lib';
import {
	canSeeNotification,
	getNotification,
	markAsRead,
	markAsUnread,
	PAM,
	saveNotification,
} from 'server-common';
import wrapper from '../../lib/wrapper';

export const func: ServerAPIEndpoint<api.notifications.ToggleNotificationRead> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	getNotification(req.mysqlx)(req.account)(req.params.id)
		.filter(canSeeNotification(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Cannot view notification',
		})
		.map(notif => (notif.read ? markAsUnread(notif) : markAsRead(notif)))
		.flatMap(saveNotification(req.mysqlx))
		.map(destroy)
		.map(wrapper),
);

export default func;
