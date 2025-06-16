/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * This file documents how to change and get temporary duty positions
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
import { NewShortCAPUnitDutyPosition, ShortCAPUnitDutyPosition } from '../../types';

/**
 * Gets the duty positions assigned on Event Manager for the specified member
 *
 * Differs from more permanent positions assigned on CAP NHQ, as these have an expiration date set
 *
 * `id` is a MemberREference formatted according to stringifyMemberReference
 *
 * This function may not be the desired one, as a CAPMemberObject also contains the duty positions
 * returned below
 */
export interface GetTemporaryDutyPositions {
	(params: { id: string }, body: {}): APIEither<ShortCAPUnitDutyPosition[]>;

	url: '/api/member/tempdutypositions/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Updates the temporary duty positions assigned to a member
 *
 * By not including a duty position, this will delete that duty position
 */
export interface SetTemporaryDutyPositions {
	(params: { id: string }, body: { dutyPositions: NewShortCAPUnitDutyPosition[] }): APIEither<
		void
	>;

	url: '/api/member/tempdutypositions/:id';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
