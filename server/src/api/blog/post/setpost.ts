import * as express from 'express';
import { join } from 'path';
import conf from '../../../conf';
import BlogPost from '../../../lib/BlogPost';
import { MemberRequest } from '../../../lib/MemberBase';
import { getSchemaValidator } from '../../../lib/Util';

// tslint:disable-next-line:no-var-requires
const blogPostSchema = require(join(conf.schemaPath, 'NewBlogPost.json'));

const privateBlogPostValidator = getSchemaValidator(blogPostSchema);

const blogPostValidator = (val: any): val is BlogPostObject =>
	privateBlogPostValidator(val) as boolean;

export default async (req: MemberRequest, res: express.Response) => {
	const blogPostData: NewBlogPost = {
		authorid: req.body.authorid,
		content: req.body.content,
		fileIDs: req.body.fileIDs,
		title: req.body.title
	};

	if (!blogPostValidator(blogPostData)) {
		console.log(privateBlogPostValidator.errors);
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

		blogPost.set(blogPostData);

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
