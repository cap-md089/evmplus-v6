/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

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
