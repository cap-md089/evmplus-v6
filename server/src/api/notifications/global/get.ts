import { ServerAPIEndpoint } from 'auto-client-api';
import { api } from 'common-lib';
import { getCurrentGlobalNotification } from 'server-common/dist/notifications';

export const func: ServerAPIEndpoint<api.notifications.global.GetGlobalNotification> = req =>
	getCurrentGlobalNotification(req.mysqlx)(req.account);

export default func;
