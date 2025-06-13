/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * This file documents how to get and manage different notifications
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../../api';
import { NotificationCause, NotificationObject, NotificationTarget } from '../../types';

export * as global from './global';

/**
 * Gets a notification by ID
 */
export interface GetNotification {
	(params: { id: string }, body: {}): APIEither<
		NotificationObject<NotificationCause, NotificationTarget>
	>;

	url: '/api/notifications/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

/**
 * Gets the notification list for the current user
 */
export interface GetNotificationList {
	(params: {}, body: {}): APIEither<
		Array<APIEither<NotificationObject<NotificationCause, NotificationTarget>>>
	>;

	url: '/api/notifications';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

/**
 * Allows a user to personally mark the notification as being read
 * For someone who can view admin notifications, this works for all admins in the account
 */
export interface ToggleNotificationRead {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/notifications/:id';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

/**
 * Allows a user to personally delete notification
 * For someone who can view admin notifications, this works for all admins in the account
 */
export interface DeleteNotification {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/notifications/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
