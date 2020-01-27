import {
	api,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	just,
	left,
	none,
	RawFileObject,
	right
} from 'common-lib';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { asyncEitherHandler, BasicMemberRequest, File } from '../../../lib/internals';

export default asyncEitherHandler<api.files.files.CreateFolder>(
	async (req: BasicMemberRequest<{ parentid: string; name: string }>) => {
		let parent: File;

		try {
			parent = await File.Get(req.params.parentid, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find parent file'
			});
		}

		if (
			!(await parent.hasPermission(
				req.member,
				req.mysqlx,
				req.account,
				FileUserAccessControlPermissions.MODIFY
			))
		) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Member does not have the required permissions'
			});
		}

		const id = uuid().replace(/-/g, '');

		const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

		const reference = req.member.getReference();

		try {
			await fileCollection
				.add({
					accountID: req.account.id,
					comments: '',
					contentType: 'application/folder',
					created: +DateTime.utc(),
					fileName: req.params.name,
					forDisplay: false,
					forSlideshow: false,
					id,
					kind: 'drive#file',
					permissions: [
						{
							type: FileUserAccessControlType.USER,
							reference,
							permission: FileUserAccessControlPermissions.FULLCONTROL
						}
					],
					owner: reference,
					fileChildren: [],
					parentID: req.params.parentid
				})
				.execute();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not add file'
			});
		}

		let file: File;

		try {
			file = await File.Get(id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not add file'
			});
		}

		return right({
			...file.toRaw(),
			uploader: req.member.toRaw()
		});
	}
);
