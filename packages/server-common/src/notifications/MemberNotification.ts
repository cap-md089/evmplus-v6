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
	notification: RawNotificationObject<NotificationCause, NotificationMemberTarget>,
): boolean => areMembersTheSame(member)(notification.target.to);

export const getMemberNotifications = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
): AsyncEither<
	ServerError,
	AsyncIter<RawNotificationObject<NotificationCause, NotificationMemberTarget>>
> =>
	asyncRight(
		schema.getCollection<RawNotificationObject>('Notifications'),
		errorGenerator('Could not get member notifications'),
	)
		.map(
			findAndBindC<RawNotificationObject<NotificationCause, NotificationMemberTarget>>({
				accountID: account.id,
				target: {
					type: NotificationTargetType.MEMBER,
					to: toReference(member),
				},
			}),
		)
		.map(generateResults)
		.map(asyncIterMap(stripProp('_id')));
