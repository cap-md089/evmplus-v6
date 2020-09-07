/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents the management of basic team information
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
import { FullTeamObject, NewTeamObject } from '../../types';

export * as members from './members';

/**
 * Creates a new team
 */
export interface CreateTeam {
	(params: {}, body: NewTeamObject): APIEither<FullTeamObject>;

	url: '/api/team';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets full team information; includes extra display information
 * (like names)
 */
export interface GetTeam {
	(params: { id: string }, body: {}): APIEither<FullTeamObject>;

	url: '/api/team/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Lists teams and some of their information;
 * view changes based on team permissions (private vs protected)
 */
export interface ListTeams {
	(params: {}, body: {}): APIEither<FullTeamObject[]>;

	url: '/api/team';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Deletes a team and removes their membership
 */
export interface DeleteTeam {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/team/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Updates team name, description, membership, etc
 */
export interface SetTeamData {
	(params: { id: string }, body: Partial<NewTeamObject>): APIEither<void>;

	url: '/api/team/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
