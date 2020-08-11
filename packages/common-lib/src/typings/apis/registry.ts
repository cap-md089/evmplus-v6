/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents management of site configuration
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

import { APIEither } from '../../typings/api';
import { RegistryValues } from '../../typings/types';

/**
 * Gets the public site configuration for an account
 */
export interface GetRegistry {
	(params: {}, body: {}): APIEither<RegistryValues>;

	url: '/api/registry';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Updates the public configuration for an account
 */
export interface SetRegistry {
	(params: {}, body: Partial<RegistryValues>): APIEither<void>;

	url: '/api/registry';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
