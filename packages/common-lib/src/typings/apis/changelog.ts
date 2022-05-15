/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents management of site configuration
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

import { APIEither } from '../api';
import { ChangeLogItem } from '../types';

/**
 * Gets the public site configuration for an account
 */
export interface GetChangeLog {
	(params: {}, body: {}): APIEither<ChangeLogItem[]>;

	url: '/api/changelog';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: false;
}

/**
 * Updates the public configuration for an account
 */
export interface AddChangeLog {
	(params: {}, body: ChangeLogItem): APIEither<void>;

	url: '/api/changelog';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
