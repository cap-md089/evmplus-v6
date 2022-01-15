/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents how flights are managed with EvMPlus.org
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
import { CAPMemberObject, MemberReference } from '../../types';

/**
 * Assigns the specified member to the specified flight
 *
 * A null flight disassociates the member with a flight, marking them as unassigned
 */
export interface Assign {
	(params: {}, body: { member: MemberReference; flight: string | null }): APIEither<void>;

	url: '/api/member/flight';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Allows assigning multiple people to different flights at once
 *
 * A null flight disassociates the member with a flight, marking them as unassigned
 */
export interface AssignBulk {
	(
		params: {},
		// eslint-disable-next-line @typescript-eslint/array-type
		body: { members: { member: MemberReference; newFlight: string | null }[] },
	): APIEither<void>;

	url: '/api/member/flight/bulk';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets member references for everyone in the flight the current member is in
 *
 * If the person making the request has any of these roles, it returns all cadets in
 * the squadron:
 * 	- Cadet Commander
 *  - Cadet Exective Officer
 *  - Cadet Deputy Commander
 *  - Deputy Commander for Cadets
 */
export interface FlightMembersBasic {
	(params: {}, body: {}): APIEither<Array<APIEither<MemberReference>>>;

	url: '/api/members/flight';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets member references for everyone in the flight the current member is in
 *
 * If the person making the request has any of these roles, it returns all cadets in
 * the squadron:
 * 	- Cadet Commander
 *  - Cadet Exective Officer
 *  - Cadet Deputy Commander for Operations
 *  - Deputy Commander for Cadets
 */
export interface FlightMembersFull {
	(params: {}, body: {}): APIEither<Array<APIEither<CAPMemberObject>>>;

	url: '/api/members/flight/full';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}
