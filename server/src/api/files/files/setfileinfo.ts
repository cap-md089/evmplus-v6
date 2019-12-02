import { api, EditableFileObjectProperties, just, left, none, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicPartialMemberValidatedRequest,
	File
} from '../../../lib/internals';

export default asyncEitherHandler<api.files.files.SetInfo>(
	async (
		req: BasicPartialMemberValidatedRequest<EditableFileObjectProperties, { fileid: string }>
	) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find file'
			});
		}

		file.set(req.body);

		try {
			await file.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save file information'
			});
		}

		return right(void 0);
	}
);
