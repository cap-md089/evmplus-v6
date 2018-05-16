import * as express from 'express';
import { BlogPost } from './index';
import * as mysql from 'promise-mysql';
import { AccountRequest } from '../../../lib/Account';
import { errorFunction } from '../../../lib/MySQLUtil';

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
					res.json({
						posts: results.map((post: {
							id: number,
							title: string,
							authorid: number,
							content: string,
							posted: number
						}) => {
							return {
								id: post.id,
								title: post.title,
								authorid: post.authorid,
								posted: post.posted,
								content: JSON.parse(post.content),
								fileIDs: []
							} as BlogPost;
						}),
						displayLeft: start !== 0,
						displayRight: start + postsPerPage < results.length
					});
				}
			}).catch(errorFunction(res));
		} else {
			res.status(400);
			res.end();
		}
	};
};
