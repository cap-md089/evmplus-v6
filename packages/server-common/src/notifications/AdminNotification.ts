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
	asyncRight,
	errorGenerator,
	hasPermission,
	Permissions,
	RawAdminNotification,
	User,
	yieldEmpty,
} from 'common-lib';
import { findAndBindC, generateResults } from '../MySQLUtil';
import { ServerEither } from '../servertypes';

export const canSeeAdminNotification = (member: User): boolean =>
	hasPermission('ViewAccountNotifications')(Permissions.ViewAccountNotifications.YES)(member);

export const getAdminNotifications = (schema: Schema) => (account: AccountObject) => (
	member: User,
): ServerEither<AsyncIterableIterator<RawAdminNotification>> =>
	hasPermission('ViewAccountNotifications')(Permissions.ViewAccountNotifications.YES)(member)
		? asyncRight(
				schema.getCollection<RawAdminNotification>('Notifications'),
				errorGenerator('Could not get admin notifications'),
		  )
				.map(
					findAndBindC<RawAdminNotification>({
						accountID: account.id,
					}),
				)
				.map(generateResults)
		: asyncRight(
				yieldEmpty<RawAdminNotification>(),
				errorGenerator('Could not get admin notifications'),
		  );
