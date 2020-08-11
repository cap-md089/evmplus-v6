/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents the APIs to manage event debrief items
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { APIEither } from '../../api';
import { DebriefItem, NewDebriefItem } from '../../types';

/**
 * Adds the specified debrief item to an event
 */
export interface Add {
	(params: { id: string }, body: NewDebriefItem): APIEither<DebriefItem[]>;

	url: '/api/events/:id/debrief';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Removes debrief items with the specified timestamp
 *
 * Timestamp is Unix timestamp in milliseconds
 */
export interface Delete {
	(params: { id: string; timestamp: string }, body: {}): APIEither<DebriefItem[]>;

	url: '/api/events/:id/debrief/:timestamp';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
