/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
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

import {
	api,
	AsyncEither,
	asyncRight,
	destroy,
	errorGenerator,
	MemberPermissions,
	MemberReference,
	parseStringMemberReference,
	Permissions,
	Right,
	SessionType,
	StoredMemberPermissions,
	stringifyMemberReference,
} from 'common-lib';
import { Backends, getCombinedPAMBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const getHighestPermissionsObject = (perms1: MemberPermissions) => (
	perms2: MemberPermissions,
): MemberPermissions => perms2;

const simplifyInputs = (
	roles: Array<{
		member: MemberReference;
		permissions: MemberPermissions;
	}>,
): Array<{
	member: MemberReference;
	permissions: MemberPermissions;
}> => {
	const members: { [key: string]: MemberPermissions } = {};

	for (const role of roles) {
		const key = stringifyMemberReference(role.member);
		members[key] = getHighestPermissionsObject(members[key] ?? role.permissions)(
			role.permissions,
		);
	}

	return Object.keys(members).map(key => ({
		member: (parseStringMemberReference(key) as Right<MemberReference>).value,
		permissions: members[key],
	}));
};

export const func: Endpoint<
	Backends<[PAM.PAMBackend]>,
	api.member.permissions.SetPermissions
> = backend =>
	PAM.RequiresPermission(
		'PermissionManagement',
		Permissions.PermissionManagement.FULL,
	)(
		PAM.RequireSessionType(SessionType.REGULAR)(req =>
			asyncRight(
				req.mysqlxSession.startTransaction(),
				errorGenerator('Could not save permissions'),
			)
				.tap(() =>
					req.mysqlx
						.getCollection<StoredMemberPermissions>('UserPermissions')
						.remove('accountID = :accountID')
						.bind('accountID', req.account.id)
						.execute(),
				)
				.tap(() =>
					AsyncEither.All([
						...simplifyInputs(req.body.newRoles)
							.filter(role => role.permissions.type === req.account.type)
							.map(newRole =>
								backend.setPermissions(req.account)(newRole.member)(
									newRole.permissions,
								),
							),
					]),
				)
				.tap(() => req.mysqlxSession.commit())
				.leftTap(() => req.mysqlxSession.rollback())
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedPAMBackend());
