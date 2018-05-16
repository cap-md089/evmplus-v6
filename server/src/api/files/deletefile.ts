import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import { MemberRequest } from '../../lib/Member';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		typeof req.account !== 'undefined'
	) {
		await req.connectionPool.query(
			'DELETE FROM blog WHERE id = ? AND AccountID = ?',
			[req.params.id, req.account.id],
		);

		res.status(204);
		res.end();
	} else {
		res.status(400);
		res.end();
	}
};
