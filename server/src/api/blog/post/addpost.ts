import * as express from 'express';
import * as mysql from 'promise-mysql';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';
import { json } from '../../../lib/Util';
import { BlogPost } from '../../../types';

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return async (req: AccountRequest & MemberRequest, res, next) => {
		if (
			typeof req.account !== 'undefined' &&
			typeof req.body !== 'undefined' &&
			typeof req.body.content !== 'undefined' &&
			typeof req.body.title !== 'undefined' &&
			typeof req.member !== 'undefined'
		) {
			const result: Array<{newID: number}> = 
				await connectionPool.query('SELECT MAX(id) as newID FROM blog WHERE AccountID = ?', req.account.id);
			const newID: number = result[0].newID || 1;
			const posted = Date.now() / 1000;

			const newPost = [
				newID,
				req.body.title,
				0,
				JSON.stringify(req.body.content),
				posted,
				req.account.id
			];

			await connectionPool.query(
				'INSERT INTO blog (id, title, authorid, content, posted, AccountID) VALUES (?, ?, ?, ?, ?, ?);',
				newPost
			);

			json<BlogPost>(res, {
				accountID: req.account.id,
				authorid: 0,
				content: req.body.content,
				fileIDs: [],
				id: newID,
				posted,
				title: req.body.title
			});
		} else {
			res.status(400);
			res.end();
		}
	};
};
