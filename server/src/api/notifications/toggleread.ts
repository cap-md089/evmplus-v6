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

export const func: ServerAPIEndpoint<api.notifications.ToggleNotificationRead> = PAM.RequireSessionType(
	SessionType.REGULAR
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
);

export default func;
