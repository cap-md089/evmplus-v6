import {
	FileTeamControlList,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FileUserControlList,
	RawFileObject,
	User,
} from '../typings/types';
import { areMembersTheSame } from './Member';

export const userHasFilePermission = (permission: FileUserAccessControlPermissions) => (
	member?: User | null | undefined
) => (file: RawFileObject) => {
	const otherPermissions = file.permissions.filter(
		perm => perm.type === FileUserAccessControlType.OTHER
	);
	const signedInPermissions = file.permissions.filter(
		perm => perm.type === FileUserAccessControlType.SIGNEDIN
	);
	const accountPermissions = file.permissions.filter(
		perm => perm.type === FileUserAccessControlType.ACCOUNTMEMBER
	);
	const teamPermissions = file.permissions.filter(
		perm => perm.type === FileUserAccessControlType.TEAM
	) as FileTeamControlList[];
	const memberPermissions = file.permissions.filter(
		perm => perm.type === FileUserAccessControlType.USER
	) as FileUserControlList[];

	let valid = false;

	otherPermissions.forEach(
		perm =>
			// tslint:disable-next-line:no-bitwise
			(valid = valid || (perm.permission & permission) > 0)
	);

	if (member === null || valid) {
		return valid;
	}

	signedInPermissions.forEach(
		perm =>
			// tslint:disable-next-line:no-bitwise
			(valid = valid || (perm.permission & permission) > 0)
	);

	if (valid) {
		return true;
	}

	accountPermissions.forEach(
		perm =>
			// tslint:disable-next-line:no-bitwise
			(valid = valid || (perm.permission & permission) > 0)
	);

	if (valid) {
		return true;
	}

	if (member) {
		memberPermissions.forEach(
			perm =>
				(valid =
					valid ||
					// tslint:disable-next-line:no-bitwise
					((perm.permission & permission) > 0 &&
						areMembersTheSame(member)(perm.reference)))
		);

		if (valid) {
			return true;
		}

		if (teamPermissions.length === 0) {
			return false;
		}

		member.teamIDs.forEach(i =>
			teamPermissions.forEach(
				perm =>
					(valid =
						valid ||
						(perm.teamID === i &&
							// tslint:disable-next-line:no-bitwise
							(perm.permission & permission) > 0))
			)
		);
	}

	return valid;
};
