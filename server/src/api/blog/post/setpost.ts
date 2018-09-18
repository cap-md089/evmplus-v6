import * as express from 'express';
import { BlogPostValidator } from '.';
import BlogPost from '../../../lib/BlogPost';
import { MemberRequest } from '../../../lib/MemberBase';

export default (blogPostValidator: BlogPostValidator) => {
	return async (req: MemberRequest, res: express.Response) => {
		if (req.member === null) {
			res.status(403);
			res.end();
			return;
		}

		if (!blogPostValidator(req.body)) {
			res.status(400);
			res.end();
			return;
		}

		try {
			const blogPost = await BlogPost.Get(
				req.params.id,
				req.account,
				req.mysqlx
			);

			blogPost.set(req.body);

			await blogPost.save();

			res.status(204);
			res.end();
		} catch (e) {
			if (e.message === 'Could not get blog post') {
				res.status(404);
				res.end();
			} else {
				// tslint:disable-next-line:no-console
				console.log(e);
				res.status(500);
				res.end();
			}
		}
	};
};
