import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/Member';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		req.is('json') &&
		typeof req.account !== 'undefined' &&
		// typeof req.member !== 'undefined' &&
		typeof req.params.fileid !== 'undefined' &&
		typeof req.body !== 'undefined'
	) {
		const {
			fileName,
			comments,
			memberOnly,
			forDisplay,
			forSlideshow,
		} = req.body;

		const newFile = {
			fileName,
			comments,
			memberOnly,
			forDisplay,
			forSlideshow,
		};

		const query = req.connectionPool.query(
			'UPDATE FileInfo SET ? WHERE id = ? AND AccountID = ?',
			[
				newFile,
				req.params.fileid,
				req.account.id
			],
		);

		await query;

		res.status(204);
		res.end();
	} else {
		res.status(400);
		res.end();
	}
};
