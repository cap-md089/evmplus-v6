import { BlogPostObject, NewBlogPost } from 'common-lib';
import * as express from 'express';
import BlogPost from '../../../lib/BlogPost';
import { asyncErrorHandler, json } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewBlogPost>, res: express.Response) => {
		const post = await BlogPost.Create(req.body, req.member, req.account, req.mysqlx);

		json<BlogPostObject>(res, post.toRaw());
	}
);
