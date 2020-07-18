import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterMap,
	asyncRight,
	errorGenerator,
	Member,
	MemberReference,
	NotificationCause,
	NotificationMemberTarget,
	NotificationTargetType,
	RawNotificationObject,
	ServerError,
	stripProp,
	toReference,
} from 'common-lib';
import { findAndBindC, generateResults } from '../MySQLUtil';

export const canSeeMemberNotification = (member: Member) => (
	notification: RawNotificationObject<NotificationCause, NotificationMemberTarget>
) => areMembersTheSame(member)(notification.target.to);

export const getMemberNotifications = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
): AsyncEither<
	ServerError,
	AsyncIter<RawNotificationObject<NotificationCause, NotificationMemberTarget>>
> =>
	asyncRight(
		schema.getCollection<RawNotificationObject>('Notifications'),
		errorGenerator('Could not get member notifications')
	)
		.map(
			findAndBindC<RawNotificationObject<NotificationCause, NotificationMemberTarget>>({
				accountID: account.id,
				target: {
					type: NotificationTargetType.MEMBER,
					to: toReference(member),
				},
			})
		)
		.map(generateResults)
		.map(asyncIterMap(stripProp('_id')));
