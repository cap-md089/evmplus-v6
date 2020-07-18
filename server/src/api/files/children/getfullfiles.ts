import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	asyncIterFilter,
	asyncIterMap,
	errorGenerator,
	FileUserAccessControlPermissions,
	Maybe,
	userHasFilePermission,
} from 'common-lib';
import { expandFileObject, expandRawFileObject, getChildren, getFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func: ServerAPIEndpoint<api.files.children.GetFullFiles> = req =>
	getFileObject(true)(req.mysqlx)(req.account)(req.params.parentid)
		.filter(canRead(Maybe.join(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot read the file requested',
		})
		.flatMap(getChildren(req.mysqlx)(req.account))
		.map(asyncIterFilter(canRead(Maybe.join(req.member))))
		.map(asyncIterMap(expandRawFileObject(req.mysqlx)(req.account)))
		.map(
			asyncIterMap(file =>
				asyncEither(file, errorGenerator('Could not get full file information')).flatMap(
					expandFileObject(req.mysqlx)(req.account)
				)
			)
		);

export default func;
