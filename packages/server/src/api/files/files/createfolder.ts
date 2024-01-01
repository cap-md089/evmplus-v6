/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	always,
	api,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	Maybe,
	RawFileObject,
	SessionType,
	toReference,
	userHasFilePermission,
} from 'common-lib';
import * as debug from 'debug';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	FileBackend,
	getCombinedFileBackend,
	getRandomBackend,
	getTimeBackend,
	PAM,
	RandomBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canAddSubfolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

const logFunc = debug('server:api:files:files:createfolder');

export const func: Endpoint<
	Backends<[TimeBackend, RandomBackend, FileBackend]>,
	api.files.files.CreateFolder
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getFileObject(req.account)(Maybe.some(req.member))(req.params.parentid)
			.tap(file => logFunc('Creating folder in %O', file))
			.leftTap(() => logFunc("Couldn't find parent folder with id '%s'", req.params.parentid))
			.filter(canAddSubfolder(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to do that',
			})
			.filter(file => file.contentType === 'application/folder', {
				type: 'OTHER',
				code: 403,
				message: 'You can only add a subfolder to a folder',
			})
			.map(({ id: parentID }) => {
				const id = backend.uuid().replace(/-/g, '');

				const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

				const owner = toReference(req.member);

				const newFile: RawFileObject = {
					accountID: req.account.id,
					comments: '',
					contentType: 'application/folder',
					created: backend.now(),
					fileName: req.params.name,
					forDisplay: false,
					forSlideshow: false,
					id,
					kind: 'drive#file',
					owner,
					parentID,
					permissions: [
						{
							type: FileUserAccessControlType.USER,
							reference: owner,
							permission: FileUserAccessControlPermissions.FULLCONTROL,
						},
					],
				};

				logFunc('Creating folder %O', newFile);

				return fileCollection.add(newFile).execute().then(always(newFile));
			})
			.flatMap(backend.expandRawFileObject(Maybe.some(req.member)))
			.map(file => ({
				...file,
				uploader: Maybe.some(req.member),
			}))
			.map(wrapper),
	);

export default withBackends(
	func,
	combineBackends<BasicAccountRequest, [TimeBackend, RandomBackend, FileBackend]>(
		getTimeBackend,
		getRandomBackend,
		getCombinedFileBackend(),
	),
);
