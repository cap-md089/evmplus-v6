/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * This file documents the management of team membership
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
import { Member, NewTeamMember } from '../../types';

/**
 * Gets full member information for a team; changes based off of
 * team permissions
 */
export interface ListTeamMembers {
	(params: { id: string }, body: {}): APIEither<Member[]>;

	url: '/api/team/:id/members';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Modifies the role of a team member
 */
export interface ModifyTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Adds the member specified
 */
export interface AddTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Remove a member from a team
 */
export interface DeleteTeamMember {
	(params: { id: string; memberid: string }, body: {}): APIEither<void>;

	url: '/api/teams/:id/members/:memberid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
