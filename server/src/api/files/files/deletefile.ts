import { ServerAPIEndpoint } from 'auto-client-api';
import { api, FileUserAccessControlPermissions, userHasFilePermission } from 'common-lib';
import { deleteFileObject, getFileObject } from 'server-common';

const canDeleteFile = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: ServerAPIEndpoint<api.files.files.Delete> = req =>
	getFileObject(false)(req.mysqlx)(req.account)(req.params.fileid)
		.filter(canDeleteFile(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot delete file',
		})
		.flatMap(deleteFileObject(req.configuration)(req.mysqlx)(req.account));

export default func;
