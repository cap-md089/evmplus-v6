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
	asyncLeft,
	getFullMemberName,
	NotificationCause,
	NotificationCauseType,
	NotificationDataMessage,
	NotificationDataType,
	NotificationEveryoneTarget,
	NotificationObject,
	NotificationTargetType,
	Permissions,
	ServerError,
	SessionType,
	toReference,
} from 'common-lib';
import { createNotification, PAM } from 'server-common';
import { hasGlobalNotification } from 'server-common/dist/notifications';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.notifications.global.CreateGlobalNotification> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(
	PAM.RequiresPermission(
		'CreateNotifications',
		Permissions.Notify.GLOBAL,
	)(req =>
		hasGlobalNotification(req.mysqlx)(req.account)
			.flatMap(hasNotification =>
				hasNotification
					? asyncLeft<
							ServerError,
							NotificationObject<
								NotificationCause,
								NotificationEveryoneTarget,
								NotificationDataMessage
							>
					  >({
							type: 'OTHER',
							code: 400,
							message:
								'Cannot create a global notification when one is already in effect',
					  })
					: createNotification(req.mysqlx)(req.account)({
							cause: {
								type: NotificationCauseType.MEMBER,
								from: toReference(req.member),
								fromName: getFullMemberName(req.member),
							},
							extraData: {
								type: NotificationDataType.MESSAGE,
								message: req.body.text,
							},
							target: {
								type: NotificationTargetType.EVERYONE,
								accountID: req.account.id,
								expires: req.body.expires,
							},
					  }),
			)
			.map(wrapper),
	),
);

export default func;
