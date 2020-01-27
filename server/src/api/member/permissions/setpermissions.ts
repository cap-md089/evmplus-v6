import {
	api,
	just,
	left,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	right
} from 'common-lib';
import {
	areMemberReferencesTheSame,
	asyncEitherHandler,
	BasicMemberValidatedRequest,
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

export default asyncEitherHandler<api.member.permissions.Set>(
	async (req: BasicMemberValidatedRequest<PermissionsList>) => {
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

		try {
			await Promise.all(
				newRoles.map(role =>
					setPermissionsForMemberInAccount(
						req.mysqlx,
						role.member,
						role.permissions,
						req.account
					)
				)
			);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not set permissions for the members provided'
			});
		}

		return right(void 0);
	}
);
