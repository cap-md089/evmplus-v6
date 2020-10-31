/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of emv6.
 *
 * emv6 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * emv6 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with emv6.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../../api';
import { CadetPromotionStatus } from '../../types';

/**
 * Gets promotion requirements for the current member
 */
export interface RequirementsForCurrentUser {
	(params: {}, body: {}): APIEither<CadetPromotionStatus>;

	url: '/api/member/promotionrequirements/currentuser';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}
