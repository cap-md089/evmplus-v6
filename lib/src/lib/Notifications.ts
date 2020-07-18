import {
	NotificationAdminTarget,
	NotificationCause,
	NotificationEveryoneTarget,
	NotificationMemberTarget,
	NotificationTarget,
	NotificationTargetType,
	RawNotificationObject,
} from '../typings/types';

export const isAdminNotification = (
	notificationObject: RawNotificationObject<NotificationCause, NotificationTarget>
): notificationObject is RawNotificationObject<NotificationCause, NotificationAdminTarget> =>
	notificationObject.target.type === NotificationTargetType.ADMINS;

export const isGlobalNotification = (
	notificationObject: RawNotificationObject<NotificationCause, NotificationTarget>
): notificationObject is RawNotificationObject<NotificationCause, NotificationEveryoneTarget> =>
	notificationObject.target.type === NotificationTargetType.EVERYONE;

export const isMemberNotification = (
	notificationObject: RawNotificationObject<NotificationCause, NotificationTarget>
): notificationObject is RawNotificationObject<NotificationCause, NotificationMemberTarget> =>
	notificationObject.target.type === NotificationTargetType.MEMBER;
