import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	asyncIterFilter,
	asyncIterReduce,
	asyncRight,
	countAsync,
	errorGenerator,
	GlobalNotification,
	Maybe,
	MaybeObj,
	NotificationCause,
	NotificationDataMessage,
	NotificationDataType,
	NotificationEveryoneTarget,
	NotificationObject,
	NotificationTargetType,
} from 'common-lib';
import { findAndBindC, generateResults } from '../MySQLUtil';
import { ServerEither } from '../servertypes';

export const hasGlobalNotification = (schema: Schema) => (account: AccountObject) =>
	asyncRight(
		schema.getCollection<GlobalNotification>('Notifications'),
		errorGenerator('Could not get notifications')
	)
		.map(
			findAndBindC<GlobalNotification>({
				accountID: account.id,
				// @ts-ignore
				target: {
					accountID: account.id,
					type: NotificationTargetType.EVERYONE,
				},
			})
		)
		.map<AsyncIterableIterator<GlobalNotification>>(generateResults)
		.map(
			asyncIterFilter<GlobalNotification>(
				notif => notif.target.expires > Date.now() && !notif.read
			)
		)
		.map(countAsync)
		.map(result => result === 1);

export const getCurrentGlobalNotification = (schema: Schema) => (
	account: AccountObject
): ServerEither<
	MaybeObj<
		NotificationObject<NotificationCause, NotificationEveryoneTarget, NotificationDataMessage>
	>
> =>
	asyncRight(
		schema.getCollection<GlobalNotification>('Notifications'),
		errorGenerator('Could not get notifications')
	)
		.map(
			findAndBindC<GlobalNotification>({
				accountID: account.id,
				// @ts-ignore
				target: {
					accountID: account.id,
					type: NotificationTargetType.EVERYONE,
				},
			})
		)
		.map<AsyncIterableIterator<GlobalNotification>>(generateResults)
		.map(
			asyncIterReduce<
				GlobalNotification,
				MaybeObj<
					NotificationObject<
						NotificationCause,
						NotificationEveryoneTarget,
						NotificationDataMessage
					>
				>
			>((prev, curr) =>
				curr.extraData.type === NotificationDataType.MESSAGE
					? Maybe.isSome(prev)
						? Maybe.none()
						: Maybe.some(
								curr as NotificationObject<
									NotificationCause,
									NotificationEveryoneTarget,
									NotificationDataMessage
								>
						  )
					: prev
			)(Maybe.none())
		);
