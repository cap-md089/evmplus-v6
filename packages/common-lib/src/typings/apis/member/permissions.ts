/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents management of the permissions resource
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
import { MemberPermissions, MemberReference } from '../../types';

/**
 * Contains the information a member will have concerning their permissions
 */
export interface PermissionInformation {
	member: MemberReference;
	permissions: MemberPermissions;
}

/**
 * Sets all the permissions of the unit.
 *
 * By not including a member, this will delete the permissions they have
 */
export interface SetPermissions {
	(
		params: {},
		body: {
			newRoles: PermissionInformation[];
		},
	): APIEither<void>;

	url: '/api/member/permissions';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets a list of all the members who have permissions in the unit
 */
export interface GetPermissions {
	(params: {}, body: {}): APIEither<PermissionInformation[]>;

	url: '/api/member/permissions';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}
