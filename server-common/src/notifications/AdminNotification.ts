import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	asyncRight,
	errorGenerator,
	hasPermission,
	NotificationAdminTarget,
	NotificationCause,
	NotificationData,
	NotificationObject,
	Permissions,
	RawAdminNotification,
	User,
	yieldEmpty,
} from 'common-lib';
import { findAndBindC, generateResults } from '../MySQLUtil';
import { ServerEither } from '../servertypes';

export const canSeeAdminNotification = (member: User) => (
	notification: NotificationObject<NotificationCause, NotificationAdminTarget, NotificationData>
) => hasPermission('ViewAccountNotifications')(Permissions.ViewAccountNotifications.YES)(member);

export const getAdminNotifications = (schema: Schema) => (account: AccountObject) => (
	member: User
): ServerEither<AsyncIterableIterator<RawAdminNotification>> =>
	hasPermission('ViewAccountNotifications')(Permissions.ViewAccountNotifications.YES)(member)
		? asyncRight(
				schema.getCollection<RawAdminNotification>('Notifications'),
				errorGenerator('Could not get admin notifications')
		  )
				.map(
					findAndBindC<RawAdminNotification>({
						accountID: account.id,
					})
				)
				.map(generateResults)
		: asyncRight(
				yieldEmpty<RawAdminNotification>(),
				errorGenerator('Could not get admin notifications')
		  );
