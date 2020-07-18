import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	FileUserAccessControlPermissions,
	Maybe,
	User,
	userHasFilePermission,
} from 'common-lib';
import { expandFileObject, expandRawFileObject, getFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const orNull = Maybe.orSome<null | User>(null);

export const func: ServerAPIEndpoint<api.files.files.GetFullFile> = req =>
	getFileObject(true)(req.mysqlx)(req.account)(req.params.id)
		.filter(canRead(orNull(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to do that',
		})
		.flatMap(expandRawFileObject(req.mysqlx)(req.account))
		.flatMap(expandFileObject(req.mysqlx)(req.account));

export default func;
