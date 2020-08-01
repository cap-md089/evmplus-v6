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
import { AbsenteeInformation, Member, MemberReference, PasswordSetResult } from '../../types';

export * as account from './account';
export * as attendance from './attendance';
export * as capwatch from './capwatch';
export * as flight from './flight';
export * as permissions from './permissions';
export * as temporarydutypositions from './temporarydutypositions';

export interface SetAbsenteeInformation {
	(params: {}, body: AbsenteeInformation): APIEither<void>;

	url: '/api/member/absent';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface PasswordReset {
	(params: {}, body: { password: string }): APIEither<PasswordSetResult>;

	url: '/api/member/passwordreset';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface Members {
	(params: {}, body: {}): APIEither<Member[]>;

	url: '/api/member';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface Su {
	(params: {}, body: MemberReference): APIEither<void>;

	url: '/api/member/su';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
