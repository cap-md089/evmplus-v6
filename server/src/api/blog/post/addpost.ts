import * as express from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import BlogPost from '../../../lib/BlogPost';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewBlogPost>, res: express.Response) => {
		const post = await BlogPost.Create(
			req.body,
			req.member,
			req.account,
			req.mysqlx
		);

		json<BlogPostObject>(res, post.toRaw());
	}
);
