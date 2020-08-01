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

import { always, CAPMember, Either, Member, MemberCreateError, SigninReturn } from 'common-lib';
import fetchApi from './apis';

export const isCAPMember = (m?: Member): m is CAPMember =>
	m?.type === 'CAPNHQMember' || m?.type === 'CAPProspectiveMember';

/**
 * Given a session ID, queries the server for the member that the session ID belongs to
 *
 * @param sessionID The session ID for the member to get
 */
export function getMember(sessionID: string): Promise<SigninReturn> {
	return fetchApi
		.check({}, {}, sessionID)
		.leftFlatMap(always(Either.right({ error: MemberCreateError.UNKOWN_SERVER_ERROR })))
		.fullJoin();
}
