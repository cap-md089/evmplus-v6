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

import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncEither, destroy, errorGenerator, SessionType } from 'common-lib';
import { PAM, resolveReference, saveExtraMemberInformation } from 'server-common';
import { getExtraMemberInformationForCAPMember } from 'server-common/dist/member/members/cap';

export const func: ServerAPIEndpoint<api.member.flight.Assign> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('FlightAssign')(req =>
		resolveReference(req.mysqlx)(req.account)(req.body.member)
			.map(member => ({
				...member,
				flight: req.body.flight
			}))
			.flatMap(member =>
				asyncEither(
					getExtraMemberInformationForCAPMember(req.account)(member),
					errorGenerator('Could not save flight information')
				)
					.flatMap(saveExtraMemberInformation(req.mysqlx)(req.account))
					.tap(() =>
						req.memberUpdateEmitter.emit('memberChange', {
							member,
							account: req.account
						})
					)
					.map(destroy)
			)
	)
);

export default func;
