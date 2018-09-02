import * as express from 'express';
import { BlogPostValidator } from '.';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { MemberRequest } from '../../../lib/MemberBase';

export default (blogPostValidator: BlogPostValidator) => {
	return async (req: AccountRequest & MemberRequest, res: express.Response) => {
		if (
			req.is('json') &&
			typeof req.account !== 'undefined' &&
			// typeof req.member !== 'undefined' &&
			blogPostValidator(req.body)
		) {
			try {
				const blogPost = await BlogPost.Get(req.params.id, req.account, req.mysqlx);

				blogPost.set(req.body);

				await blogPost.save();

				res.status(204);
				res.end();
			} catch (e) {
				if (e.message === 'Could not get blog post') {
					res.status(400);
					res.end();
				} else {
					// tslint:disable-next-line:no-console
					console.log(e);
					res.status(500);
					res.end();
				}
			}
		} else {
			res.status(400);
			res.end();
		}
	}
};