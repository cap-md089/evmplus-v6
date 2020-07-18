import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	destroy,
	errorGenerator,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	parseStringMemberReference,
	Right,
	SessionType,
	stringifyMemberReference,
	toReference,
} from 'common-lib';
import { PAM } from 'server-common';
import { setPermissionsForMemberInAccount } from 'server-common/dist/member/pam';

const getHighestPermissionsObject = (perms1: MemberPermissions) => (
	perms2: MemberPermissions
): MemberPermissions =>
	(Object.fromEntries(
		Object.keys(perms1).map((key: MemberPermission) => [
			key,
			perms1[key] > perms2[key] ? perms1[key] : perms2[key],
		])
	) as unknown) as MemberPermissions;

const simplifyInputs = (
	roles: Array<{
		member: MemberReference;
		permissions: MemberPermissions;
	}>
): Array<{
	member: MemberReference;
	permissions: MemberPermissions;
}> => {
	const members: { [key: string]: MemberPermissions } = {};

	for (const role of roles) {
		const key = stringifyMemberReference(role.member);
		members[key] = getHighestPermissionsObject(members[key] ?? role.permissions)(
			role.permissions
		);
	}

	return Object.keys(members).map(key => ({
		member: (parseStringMemberReference(key) as Right<MemberReference>).value,
		permissions: members[key],
	}));
};

export const func: ServerAPIEndpoint<api.member.permissions.SetPermissions> = PAM.RequiresPermission(
	'PermissionManagement'
)(
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(
			Promise.all(
				simplifyInputs(req.body.newRoles).map(newRole =>
					setPermissionsForMemberInAccount(
						req.mysqlx,
						toReference(req.member),
						newRole.permissions,
						req.account
					)
				)
			),
			errorGenerator('Could not save permissions')
		).map(destroy)
	)
);

export default func;
