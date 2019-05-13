import { NewBlogPost } from 'common-lib';
import * as express from 'express';
import BlogPost from '../../../lib/BlogPost';
import { asyncErrorHandler } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<NewBlogPost>, { id: string }>,
		res: express.Response
	) => {
		let blogPost;

		try {
			blogPost = await BlogPost.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
		}

		blogPost.set(req.body);

		await blogPost.save();

		res.status(204);
		res.end();
	}
);
