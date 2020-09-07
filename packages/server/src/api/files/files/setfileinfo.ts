/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

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
		.rules,
);

export const func: ServerAPIEndpoint<api.files.files.SetInfo> = PAM.RequireSessionType(
	SessionType.REGULAR,
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
			.map(destroy),
	),
);

export default func;
