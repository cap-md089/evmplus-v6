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
	ServerError,
	SessionType,
	toReference,
} from 'common-lib';
import { createNotification, PAM } from 'server-common';
import { hasGlobalNotification } from 'server-common/dist/notifications';

export const func: ServerAPIEndpoint<api.notifications.global.CreateGlobalNotification> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('CreateNotifications')(req =>
		hasGlobalNotification(req.mysqlx)(req.account).flatMap(hasNotification =>
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
				  })
		)
	)
);

export default func;
