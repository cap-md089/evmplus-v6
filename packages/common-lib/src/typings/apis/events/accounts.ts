/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents CAPEventAccount management functions
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

import { APIEither } from '../../api';
import { NewEventObject, RawCAPEventAccountObject } from '../../types';

/**
 * Simplifies the creation of CAPEventAccount types
 *
 *  - Creates an account at the account ID specified
 * 	- Creates a Registry and stores the account name
 *  - Creates the event specified on the new account
 *  - Links that event to the parent account
 * 	- Adds permissions for the creator of the event as an admin of the new account
 */
export interface AddEventAccount {
	(
		params: {},
		body: {
			accountID: string;
			accountName: string;
			event: NewEventObject;
		},
	): APIEither<RawCAPEventAccountObject>;

	url: '/api/events/account/';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
