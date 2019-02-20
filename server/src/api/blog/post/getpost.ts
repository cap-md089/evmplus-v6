import { FullBlogPostObject } from 'common-lib';
import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: AccountRequest, res: express.Response) => {
	try {
		const blogPost = await BlogPost.Get(req.params.id, req.account, req.mysqlx);

		json<FullBlogPostObject>(res, blogPost.toRaw());
	} catch (e) {
		if (e.message === 'Could not get blog post') {
			res.status(404);
			res.end();
		} else {
			throw e;
		}
	}
});
