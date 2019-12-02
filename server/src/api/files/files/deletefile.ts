import { just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, File } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ fileid: string }>) => {
	let file;

	try {
		file = await File.Get(req.params.fileid, req.account, req.mysqlx);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find file to delete'
		});
	}

	try {
		await file.delete();
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not delete file'
		});
	}

	return right(void 0);
});
