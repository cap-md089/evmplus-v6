import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { json } from '../../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.params.id !== 'undefined'
	) {
		try {
			const blogPost = await BlogPost.Get(req.params.id, req.account, req.mysqlx);

			json<BlogPostObject>(res, blogPost.toRaw());
		} catch(e) {
			if (e.message === 'Could not get blog post') {
				res.status(404);
				res.end();
			} else {
				// tslint:disable-next-line:no-console
				console.log(e);
				res.status(400);
				res.end();
			}
		}
	} else {
		res.status(400);
		res.end();
	}
};