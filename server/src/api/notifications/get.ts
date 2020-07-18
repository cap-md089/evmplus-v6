import { ServerAPIEndpoint } from 'auto-client-api';
import { api, SessionType } from 'common-lib';
import { canSeeNotification, getNotification, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.notifications.GetNotification> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getNotification(req.mysqlx)(req.account)(req.params.id).filter(canSeeNotification(req.member), {
		type: 'OTHER',
		code: 403,
		message: 'User cannot see notification',
	})
);

export default func;
