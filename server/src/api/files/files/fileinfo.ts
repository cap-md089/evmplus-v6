import {
	api,
	FileObject,
	FileUserAccessControlPermissions,
	just,
	left,
	none,
	right
} from 'common-lib';
import { asyncEitherHandler, BasicConditionalMemberRequest, File } from '../../../lib/internals';

export default asyncEitherHandler<api.files.files.GetFile<FileObject>>(
	async (req: BasicConditionalMemberRequest<{ method?: string; fileid: string }>) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find file specified'
			});
		}

		if (
			!(await file.hasPermission(
				req.member,
				req.mysqlx,
				req.account,
				FileUserAccessControlPermissions.READ
			))
		) {
			return left({
				code: 403,
				error: none<Error>(),
				message: 'Member does not have permission to do that'
			});
		}

		if (req.params.method && req.params.method === 'dirty') {
			try {
				return right(await file.toFullRaw());
			} catch (e) {
				return left({
					code: 500,
					error: just(e),
					message: 'Could not get owner information about file'
				});
			}
		} else {
			return right(file.toRaw());
		}
	}
);
