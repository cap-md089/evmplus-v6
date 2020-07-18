import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	destroy,
	FileUserAccessControlPermissions,
	get,
	userHasFilePermission,
} from 'common-lib';
import { getFileObject, saveFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: ServerAPIEndpoint<api.files.children.RemoveChild> = req =>
	AsyncEither.All([
		getFileObject(false)(req.mysqlx)(req.account)(req.params.parentid),
		getFileObject(true)(req.mysqlx)(req.account)(req.params.childid),
	])
		.filter(([parent, child]) => canModify(req.member)(parent) && canRead(req.member)(child), {
			type: 'OTHER',
			code: 403,
			message:
				'Member needs to be able to read child and modify parent in order to perform this action',
		})
		.map(get(1))
		.filter(child => child.parentID === req.params.parentid, {
			type: 'OTHER',
			code: 400,
			message: 'Child object is not a child of the requested parent object',
		})
		.map(child => ({
			...child,
			parentID: 'root',
		}))
		.map(saveFileObject(req.mysqlx))
		.map(destroy);

export default func;
