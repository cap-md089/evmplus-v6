import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		req.is('json') &&
		typeof req.account !== 'undefined' &&
		// typeof req.member !== 'undefined' &&
		typeof req.params.fileid !== 'undefined' &&
		typeof req.body !== 'undefined' &&
		typeof req.body.fileName === 'string' &&
		typeof req.body.comments === 'string' &&
		typeof req.body.memberOnly === 'boolean' &&
		typeof req.body.forDisplay === 'boolean' &&
		typeof req.body.forSlideshow === 'boolean'
	) {
		const {
			fileName,
			comments,
			memberOnly,
			forDisplay,
			forSlideshow,
		} = req.body;

		const newFile = {
			comments,
			fileName,
			forDisplay: forDisplay ? 1 : 0,
			forSlideshow: forSlideshow ? 1 : 0,
			memberOnly: memberOnly ? 1 : 0,
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
