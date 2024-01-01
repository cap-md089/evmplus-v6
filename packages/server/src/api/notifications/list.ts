/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	asyncIterConcat2,
	asyncIterMap,
	RawNotificationObject,
	SessionType,
	toReference,
} from 'common-lib';
import {
	expandNotification,
	getAdminNotifications,
	getMemberNotifications,
	PAM,
} from 'server-common';
import wrapper from '../../lib/wrapper';

export const func: ServerAPIEndpoint<api.notifications.GetNotificationList> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	AsyncEither.All([
		getMemberNotifications(req.mysqlx)(req.account)(toReference(req.member)),
		getAdminNotifications(req.mysqlx)(req.account)(req.member),
	])
		.map(([iter1, iter2]) => asyncIterConcat2<RawNotificationObject>(iter1, iter2))
		.map(asyncIterMap(expandNotification(req.mysqlx)(req.account)))
		.map(wrapper),
);

export default func;
