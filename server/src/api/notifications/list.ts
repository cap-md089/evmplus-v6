import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	asyncIterConcat,
	asyncIterMap,
	RawNotificationObject,
	SessionType,
	toReference,
} from 'common-lib';
import { expandNotification, PAM } from 'server-common';
import { getAdminNotifications, getMemberNotifications } from 'server-common/dist/notifications';

export const func: ServerAPIEndpoint<api.notifications.GetNotificationList> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	AsyncEither.All([
		getMemberNotifications(req.mysqlx)(req.account)(toReference(req.member)),
		getAdminNotifications(req.mysqlx)(req.account)(req.member),
	])
		.map(([iter1, iter2]) => asyncIterConcat<RawNotificationObject>(iter1)(always(iter2)))
		.map(asyncIterMap(expandNotification(req.mysqlx)(req.account)))
);

export default func;
