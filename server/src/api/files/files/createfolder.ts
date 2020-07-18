import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	Maybe,
	RawFileObject,
	toReference,
	userHasFilePermission,
} from 'common-lib';
import { expandRawFileObject, getFileObject } from 'server-common';
import { v4 as uuid } from 'uuid';

const canAddSubfolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: (
	uuidFunc?: typeof uuid,
	now?: () => number
) => ServerAPIEndpoint<api.files.files.CreateFolder> = (uuidFunc = uuid, now = Date.now) => req =>
	getFileObject(false)(req.mysqlx)(req.account)(req.params.parentid)
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
			const id = uuidFunc().replace(/-/g, '');

			const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

			const owner = toReference(req.member);

			const newFile: RawFileObject = {
				accountID: req.account.id,
				comments: '',
				contentType: 'application/folder',
				created: now(),
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

			return fileCollection.add(newFile).execute().then(always(newFile));
		})
		.flatMap(expandRawFileObject(req.mysqlx)(req.account))
		.map(file => ({
			...file,
			uploader: Maybe.some(req.member),
		}));

export default func();
