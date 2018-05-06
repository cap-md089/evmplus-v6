import * as express from 'express';
import * as mysql from 'mysql';
import { AccountRequest } from '../../lib/Account';
import { MemberRequest } from '../../lib/Member';

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return (req: AccountRequest & MemberRequest, res, next) => {
		if (
			req.is('json') &&
			typeof req.account !== 'undefined' &&
			typeof req.member !== 'undefined'
		) {
			connectionPool.query(
				'DELETE FROM blog WHERE id = ? AND AccountID = ?',
				[req.params.id, req.account.id],
				(err, results, fields) => {
					if (err) {
						console.log(err);
						res.status(500);
						res.end();
						return;
					}

					res.status(200);
					res.end();
				}
			);
		} else {
			res.status(400);
			res.end();
		}
	};
};
