/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents management of global notifications specifically
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../api';
import {
	NotificationCause,
	NotificationDataMessage,
	NotificationEveryoneTarget,
	NotificationObject,
} from '../../types';

/**
 * Creates a global notification that will show up on everyone's computer
 */
export interface CreateGlobalNotification {
	(params: {}, body: { text: string; expires: number }): APIEither<
		NotificationObject<NotificationCause, NotificationEveryoneTarget, NotificationDataMessage>
	>;

	url: '/api/notifications/global';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Checks to see if there is currently a global notification
 */
export interface GetGlobalNotification {
	(params: {}, body: {}): APIEither<
		MaybeObj<
			NotificationObject<
				NotificationCause,
				NotificationEveryoneTarget,
				NotificationDataMessage
			>
		>
	>;

	url: '/api/notifications/global';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: false;
}
