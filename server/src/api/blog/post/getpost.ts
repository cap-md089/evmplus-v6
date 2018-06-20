import * as express from 'express';
import * as mysql from 'promise-mysql';
import { AccountRequest } from '../../../lib/Account';
import { errorFunction } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';
import { BlogPost } from '../../../types';

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return (req: AccountRequest, res, next) => {
		if (
			typeof req.params.id !== 'undefined' &&
			typeof req.account !== 'undefined'
		) { 
			connectionPool.query(
				'SELECT title, authorid, content, posted FROM blog WHERE id = ? AND AccountID = ?',
				[req.params.id, req.account.id],
			).then(result => {
				if (result.length !== 1) {
					res.status(400);
					res.end();
					return;
				}

				const post = result[0];

				json<BlogPost>(res, {
					accountID: req.account.id,
					authorid: post.authorid,
					content: JSON.parse(post.content),
					fileIDs: [],
					id: req.params.id,
					posted: post.posted,
					title: post.title,
				});
			}).catch(errorFunction(res));
		} else {
			res.status(400);
			res.end();
		}
	};
};
