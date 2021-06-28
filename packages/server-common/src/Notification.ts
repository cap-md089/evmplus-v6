/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Collection, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	addOne,
	AsyncEither,
	asyncIterMap,
	asyncRight,
	errorGenerator,
	get,
	maxAsync,
	Maybe,
	MaybeObj,
	MemberNotification,
	NewNotificationObject,
	NotificationCause,
	NotificationCauseType,
	NotificationData,
	NotificationMemberCause,
	NotificationMemberTarget,
	NotificationObject,
	NotificationTarget,
	NotificationTargetType,
	RawNotificationObject,
	ServerError,
	User,
} from 'common-lib';
import { getMemberName } from './Members';
import {
	addToCollection,
	deleteItemFromCollectionA,
	findAndBindC,
	generateResults,
	getOneOfIDA,
	saveToCollectionA,
} from './MySQLUtil';
import { canSeeAdminNotification, canSeeMemberNotification } from './notifications';
import { ServerEither } from './servertypes';

export * from './notifications';
export * as notifications from './notifications';

export const getNotification = (schema: Schema) => (account: AccountObject) => <
	C extends NotificationCause,
	T extends NotificationTarget,
	D extends NotificationData
>(
	id: string | number,
): ServerEither<RawNotificationObject<C, T, D>> =>
	asyncRight(
		schema.getCollection<RawNotificationObject<C, T, D>>('Notifications'),
		errorGenerator('Could not get notification'),
	)
		.flatMap(
			getOneOfIDA({
				id,
				accountID: account.id,
			}),
		)
		.map(val => ({
			...val,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			cause: val.cause!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			extraData: val.extraData!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			target: val.target!,
		}));

export const expandNotification = (schema: Schema) => (account: AccountObject) => <
	C extends NotificationCause,
	T extends NotificationTarget,
	D extends NotificationData
>(
	obj: RawNotificationObject<C, T, D>,
): ServerEither<NotificationObject<C, T, D>> =>
	AsyncEither.All<ServerError, MaybeObj<string>, MaybeObj<string>>([
		obj.target.type === NotificationTargetType.MEMBER
			? getMemberName(schema)(account)((obj.target as NotificationMemberTarget).to).map(
					Maybe.some,
			  )
			: asyncRight(Maybe.none(), errorGenerator('Could not get member names')),
		obj.cause.type === NotificationCauseType.MEMBER
			? getMemberName(schema)(account)((obj.cause as NotificationMemberCause).from).map(
					Maybe.some,
			  )
			: asyncRight(Maybe.none(), errorGenerator('Could not get member names')),
	]).map(
		([toMemberName, fromMemberName]) =>
			({
				...obj,
				...(obj.target.type === NotificationTargetType.MEMBER
					? {
							toMemberName,
					  }
					: {}),
				...(obj.cause.type === NotificationCauseType.MEMBER
					? {
							fromMemberName,
					  }
					: {}),
			} as NotificationObject<C, T, D>),
	);

const getNewNotificationID = (schema: Schema) => (account: AccountObject): ServerEither<number> =>
	asyncRight(
		schema.getCollection<RawNotificationObject>('Notifications'),
		errorGenerator('Could not get notifications'),
	)
		.map(
			findAndBindC<RawNotificationObject>({
				accountID: account.id,
			}),
		)
		.map(generateResults)
		.map(asyncIterMap(get('id')))
		.map(maxAsync)
		.map(addOne);

export const markAsRead = <T extends RawNotificationObject>(notification: T): T => ({
	...notification,
	read: true,
});

export const markAsUnread = <T extends RawNotificationObject>(notification: T): T => ({
	...notification,
	read: false,
});

export const toggleRead = <T extends RawNotificationObject>(notification: T): T => ({
	...notification,
	read: !notification.read,
});

export const deleteNotification = (schema: Schema) => (
	notification: NotificationObject,
): ServerEither<void> =>
	deleteItemFromCollectionA(schema.getCollection<RawNotificationObject>('Notifications'))(
		notification,
	);

export const saveNotification = (schema: Schema) => <T extends NotificationObject>(
	notification: T,
): ServerEither<T> =>
	saveToCollectionA(schema.getCollection<RawNotificationObject>('Notifications'))(
		notification,
	) as ServerEither<T>;

export const createNotification = (schema: Schema) => (account: AccountObject) => <
	C extends NotificationCause = NotificationCause,
	T extends NotificationTarget = NotificationTarget,
	D extends NotificationData = NotificationData
>(
	notification: NewNotificationObject<C, T, D>,
): ServerEither<RawNotificationObject<C, T, D>> =>
	getNewNotificationID(schema)(account)
		.map(id => ({
			...notification,
			accountID: account.id,
			id,
			archived: false,
			read: false,
			emailSent: false,
			created: Date.now(),
		}))
		.flatMap(
			addToCollection<RawNotificationObject<C, T, D>>(
				schema.getCollection('Notifications') as Collection<RawNotificationObject<C, T, D>>,
			),
		);

export const canSeeNotification = (user: User) => (notification: NotificationObject): boolean =>
	notification.target.type === NotificationTargetType.ADMINS
		? canSeeAdminNotification(user)
		: notification.target.type === NotificationTargetType.MEMBER
		? canSeeMemberNotification(user)(notification as MemberNotification)
		: notification.target.type === NotificationTargetType.EVERYONE
		? true
		: false;
