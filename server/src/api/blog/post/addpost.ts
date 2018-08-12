import * as express from 'express';
import { DateTime } from 'luxon';
import { join } from 'path';
import conf from '../../../conf';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';
import { collectResults } from '../../../lib/MySQLUtil';
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
		const blogPosts = req.mysqlx.getCollection<BlogPost>('Blog');

		const results = await collectResults(
			blogPosts
				.find('accountID = :accountID')
				.bind('accountID', req.account.id)
		);

		const newID =
			1 +
			results
				.map(post => post.id)
				.reduce((prev, curr) => Math.max(prev, curr), 0);

		const posted = Math.round(+DateTime.utc() / 1000);

		const newPost: BlogPost = {
			accountID: req.account.id,
			authorid: req.member.id,
			content: req.body.content,
			fileIDs: req.body.fileIDs,
			id: newID,
			posted,
			title: req.body.title
		};

		await blogPosts.add(newPost).execute();

		json<BlogPost>(res, newPost);
	} else {
		res.status(400);
		res.end();
	}
};
