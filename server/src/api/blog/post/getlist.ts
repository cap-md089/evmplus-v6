import * as express from 'express';
import * as mysql from 'promise-mysql';
import { AccountRequest } from '../../../lib/Account';
import { errorFunction } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';
import { BlogPost } from './index';

const postsPerPage = 15;

export default (connectionPool: mysql.Pool): express.RequestHandler => {
	return (req: AccountRequest, res, next) => {
		if (
			typeof req.params.start !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			const start = parseInt(req.params.start, 10) * postsPerPage;

			connectionPool.query(
				`SELECT title, authorid, content, posted FROM blog WHERE AccountID = ? LIMIT ?,${postsPerPage}`,
				[req.account.id, start],
			).then(results => {
				if (results && results.length === 0 && start !== 0) {
					res.status(400);
					res.end();
				} else {
					json<{
						displayLeft: boolean,
						displayRight: boolean,
						posts: BlogPost[]
					}>(res, {
						displayLeft: start !== 0,
						displayRight: start + postsPerPage < results.length,
						posts: results.map((post: {
							id: number,
							title: string,
							authorid: number,
							content: string,
							posted: number
						}) => ({
							authorid: post.authorid,
							content: JSON.parse(post.content),
							fileIDs: [] as string[],
							id: post.id,
							posted: post.posted,
							title: post.title,
						}))
					});
				}
			}).catch(errorFunction(res));
		} else {
			res.status(400);
			res.end();
		}
	};
};
