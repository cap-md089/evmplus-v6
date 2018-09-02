import * as express from 'express';
import { join } from 'path';
import conf from '../../../conf';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { MemberRequest } from '../../../lib/MemberBase';
import { getSchemaValidator, json } from '../../../lib/Util';

// tslint:disable-next-line:no-var-requires
const blogPostSchema = require(join(conf.schemaPath, 'NewBlogPost.json'));

const privateBlogPostValidator = getSchemaValidator(blogPostSchema);

const blogPostValidator = (val: any): val is NewBlogPost =>
	privateBlogPostValidator(val) as boolean;

export default async (
		req: AccountRequest & MemberRequest,
		res: express.Response
	) => {
	if (
		typeof req.account !== 'undefined' &&
		typeof req.member !== 'undefined' && req.member !== null &&
		blogPostValidator(req.body)
	) {
		const newPost: NewBlogPost = {
			authorid: req.member.id,
			content: req.body.content,
			fileIDs: req.body.fileIDs,
			title: req.body.title
		};

		const post = await BlogPost.Create(newPost, req.account, req.mysqlx);

		json<BlogPostObject>(res, post.toRaw());
	} else {
		res.status(400);
		res.end();
	}
};
