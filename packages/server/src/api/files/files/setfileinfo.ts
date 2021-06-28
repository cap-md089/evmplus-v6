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

import { validator } from 'auto-client-api';
import {
	api,
	destroy,
	EditableFileObjectProperties,
	FileUserAccessControlPermissions,
	Maybe,
	SessionType,
	userHasFilePermission,
	Validator,
} from 'common-lib';
import { Backends, FileBackend, getCombinedFileBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const canModifyFile = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

const fileInfoValidator = Validator.Partial(
	(validator<EditableFileObjectProperties>(Validator) as Validator<EditableFileObjectProperties>)
		.rules,
);

export const func: Endpoint<Backends<[FileBackend]>, api.files.files.SetInfo> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(fileInfoValidator)(request).flatMap(req =>
			backend
				.getFileObject(req.account)(Maybe.some(req.member))(req.params.fileid)
				.filter(canModifyFile(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to carry out this action',
				})
				.map(file => ({
					...file,
					...req.body,
				}))
				.map(backend.saveFileObject)
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedFileBackend());
