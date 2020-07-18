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
			message: 'Member cannot delete notification',
		})
		.flatMap(deleteNotification(req.mysqlx))
		.map(destroy)
);

export default func;
