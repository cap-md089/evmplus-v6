/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents basic member functions that don't necessarily
 * go with another functional group
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
import { AbsenteeInformation, Member, MemberType, NHQ, PasswordSetResult } from '../../types';

export * as account from './account';
export * as attendance from './attendance';
export * as capwatch from './capwatch';
export * as flight from './flight';
export * as permissions from './permissions';
export * as promotionrequirements from './promotionrequirements';
export * as session from './session';
export * as temporarydutypositions from './temporarydutypositions';

/**
 * Lets a member set their own absentee information
 */
export interface SetAbsenteeInformation {
	(params: {}, body: AbsenteeInformation): APIEither<void>;

	url: '/api/member/absent';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Resets the password for a member
 */
export interface PasswordReset {
	(params: {}, body: { password: string }): APIEither<PasswordSetResult>;

	url: '/api/member/passwordreset';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets information for all the members in the unit
 */
export interface Members {
	(params: { type?: MemberType }, body: {}): APIEither<Member[]>;

	url: '/api/member/list/:type?';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

/**
 * Gets information for one member in the unit
 */
export interface MemberGet {
	(params: { id: string }, body: {}): APIEither<Member>;

	url: '/api/member/byid/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

export interface MemberSearchResult {
	member: Member;
	organization: MaybeObj<NHQ.Organization>;
}

/**
 * Allows for searching for members by name
 */
export interface MemberSearch {
	(params: { unitName?: string; lastName?: string; firstName?: string }, body: {}): APIEither<
		MemberSearchResult[]
	>;

	url: '/api/member/search/:unitName?/:lastName?/:firstName?';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}
