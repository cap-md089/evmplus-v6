import * as express from 'express';
import * as mysql from 'promise-mysql';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';
import { errorFunction } from '../../../lib/MySQLUtil';

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return (req: AccountRequest & MemberRequest, res, next) => {
		if (
			req.is('json') &&
			typeof req.account !== 'undefined' &&
			// typeof req.member !== 'undefined' &&
			typeof req.body !== 'undefined' &&
			typeof req.body.content !== 'undefined' &&
			typeof req.body.title !== 'undefined'
		) {
			const post = {
				title: req.body.title,
				content: JSON.stringify(req.body.content)
			};
			connectionPool.query(
				'UPDATE blog SET ? WHERE id = ? AND AccountID = ?',
				[post, req.params.id, req.account.id],
			).then(results => {
				res.status(200);
				res.end();
			}).catch(errorFunction(res));
		} else {
			res.status(400);
			res.end();
		}
	};
};
