import { MemberPermission, MemberPermissions, MemberReference } from 'common-lib';
import {
	areMemberReferencesTheSame,
	asyncErrorHandler,
	MemberValidatedRequest,
	PermissionsValidator,
	setPermissionsForMemberInAccount,
	Validator
} from '../../../lib/internals';

interface PermissionItem {
	member: MemberReference;
	permissions: MemberPermissions;
}

interface PermissionsList {
	newRoles: PermissionItem[];
}

const permissionValidator = new Validator<PermissionItem>({
	member: {
		validator: Validator.MemberReference
	},
	permissions: {
		validator: PermissionsValidator
	}
});

export const permissionsValidator = new Validator<PermissionsList>({
	newRoles: {
		validator: Validator.ArrayOf(permissionValidator)
	}
});

export default asyncErrorHandler(async (req: MemberValidatedRequest<PermissionsList>, res) => {
	/**
	 * This just sanitizes user inputs, makes sure there are no duplicates and makes sure each item
	 * is as high as possible
	 */
	const newRoles: PermissionItem[] = [];
	for (const inputRole of req.body.newRoles) {
		let found = false;
		for (const newRole of newRoles) {
			if (areMemberReferencesTheSame(newRole.member, inputRole.member)) {
				for (const perm in inputRole.permissions) {
					if (inputRole.permissions.hasOwnProperty(perm)) {
						const permission = perm as MemberPermission;
						// @ts-ignore
						newRole.permissions[permission] = Math.max(
							newRole.permissions[permission],
							inputRole.permissions[permission]
						);
					}
				}

				found = true;
			}
		}

		if (!found && inputRole.member.type !== 'Null') {
			newRoles.push(inputRole);
		}
	}

	await Promise.all(
		newRoles.map(role =>
			setPermissionsForMemberInAccount(req.mysqlx, role.member, role.permissions, req.account)
		)
	);

	res.status(204);
	res.end();
});
