import * as express from 'express';
import * as mysql from 'mysql';
import { AccountRequest } from '../../lib/Account';

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return (req: AccountRequest, res, next) => {
		if (
			typeof req.params.id !== 'undefined' &&
			typeof req.account !== 'undefined'
		) { 
			connectionPool.query(
				'SELECT title, authorid, content, posted FROM blog WHERE id = ? AND AccountID = ?',
				[req.params.id, req.account.id],
				(err, result, fields) => {
					if (err) {
						console.log(err);
						res.status(500);
						res.end();
						return;
					}

					if (result.length !== 1) {
						res.status(400);
						res.end();
						return;
					}

					const post = result[0];

					res.json({
						id: req.params.id,
						title: post.title,
						authorid: post.authorid,
						content: JSON.parse(post.content),
						posted: post.posted,
						AccountID: req.account.id
					});
				}
			);
		} else {
			res.status(400);
			res.end();
		}
	};
};
