import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	api,
	destroy,
	EditableFileObjectProperties,
	FileUserAccessControlPermissions,
	SessionType,
	userHasFilePermission,
	Validator,
} from 'common-lib';
import { getFileObject, PAM, saveFileObject } from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';

const canModifyFile = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

const fileInfoValidator = Validator.Partial(
	(validator<EditableFileObjectProperties>(Validator) as Validator<EditableFileObjectProperties>)
		.rules
);

export const func: ServerAPIEndpoint<api.files.files.SetInfo> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	validateRequest(fileInfoValidator)(request).flatMap(req =>
		getFileObject(false)(req.mysqlx)(req.account)(req.params.fileid)
			.filter(canModifyFile(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to carry out this action',
			})
			.map(file => ({
				...file,
				...req.body,
			}))
			.map(saveFileObject(req.mysqlx))
			.map(destroy)
	)
);

export default func;
