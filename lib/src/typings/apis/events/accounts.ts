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

import { APIEither } from '../../api';
import { NewEventObject, RawCAPEventAccountObject } from '../../types';

export interface AddEventAccount {
	(
		params: {},
		body: {
			accountID: string;
			accountName: string;
			event: NewEventObject;
		}
	): APIEither<RawCAPEventAccountObject>;

	url: '/api/events/account/';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
