import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	FileUserAccessControlPermissions,
	Maybe,
	userHasFilePermission,
} from 'common-lib';
import { expandRawFileObject, getChildren, getFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func: ServerAPIEndpoint<api.files.children.GetBasicFiles> = req =>
	getFileObject(true)(req.mysqlx)(req.account)(req.params.parentid)
		.filter(canRead(Maybe.join(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot read the file requested',
		})
		.flatMap(getChildren(req.mysqlx)(req.account))
		.map(asyncIterFilter(canRead(Maybe.join(req.member))))
		.map(asyncIterMap(expandRawFileObject(req.mysqlx)(req.account)));

export default func;
