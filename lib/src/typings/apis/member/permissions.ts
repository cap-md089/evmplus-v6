import { APIEither } from '../../../typings/api';
import { MemberPermissions, MemberReference } from '../../../typings/types';

export interface PermissionInformation {
	member: MemberReference;
	permissions: MemberPermissions;
}

export interface SetPermissions {
	(
		params: {},
		body: {
			newRoles: PermissionInformation[];
		}
	): APIEither<void>;

	url: '/api/member/permissions';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetPermissions {
	(params: {}, body: {}): APIEither<PermissionInformation[]>;

	url: '/api/member/permissions';

	method: 'get';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
