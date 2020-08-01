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
import { Member, NewTeamMember } from '../../types';

export interface ListTeamMembers {
	(params: { id: string }, body: {}): APIEither<Member[]>;

	url: '/api/team/:id/members';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface ModifyTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface AddTeamMember {
	(params: { id: string }, body: NewTeamMember): APIEither<void>;

	url: '/api/teams/:id/members';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface DeleteTeamMember {
	(params: { id: string; memberid: string }, body: {}): APIEither<void>;

	url: '/api/teams/:id/members/:memberid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
