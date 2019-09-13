import { EditableFileObjectProperties } from 'common-lib';
import * as express from 'express';
import { asyncErrorHandler, File, MemberValidatedRequest } from '../../../lib/internals';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<EditableFileObjectProperties>, { fileid: string }>,
		res: express.Response
	) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		file.set(req.body);

		await file.save();

		res.status(204);
		res.end();
	}
);
