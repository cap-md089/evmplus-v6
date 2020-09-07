/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	CAPProspectiveMemberReference,
	errorGenerator,
	parseStringMemberReference,
	Permissions,
	SessionType,
	toReference,
} from 'common-lib';
import { CAP, PAM, resolveReference } from 'server-common';

export const func: ServerAPIEndpoint<api.member.account.capprospective.UpgradeProspectiveAccount> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(
	PAM.RequiresPermission(
		'ProspectiveMemberManagement',
		Permissions.ProspectiveMemberManagement.FULL,
	)(req =>
		asyncEither(
			parseStringMemberReference(req.params.account),
			errorGenerator('Could not parse member reference'),
		)
			.filter(({ type }) => type === 'CAPProspectiveMember', {
				type: 'OTHER',
				code: 400,
				message: 'Cannot delete a member other than a prospective member',
			})
			.map(ref => ref as CAPProspectiveMemberReference)
			.flatMap(resolveReference(req.mysqlx)(req.account))
			.flatMap(member =>
				resolveReference(req.mysqlx)(req.account)(req.body.nhqReference)
					.map(toReference)
					.flatMap(CAP.upgradeProspectiveMemberToCAPNHQ(req.mysqlx)(member)),
			),
	),
);

export default func;
