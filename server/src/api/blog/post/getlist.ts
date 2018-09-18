import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { collectResults } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';

const postsPerPage = 15;

interface BlogPostList {
	displayLeft: boolean;
	displayRight: boolean;
	posts: BlogPostObject[]
}

export default async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.params.start !== 'undefined'
	) {
		const start = parseInt(req.params.start, 10) * postsPerPage;

		const blogPosts = req.mysqlx.getCollection<BlogPostObject>('Blog');

		const results = await collectResults(
			blogPosts
				.find('accountID = :accountID')
				.bind('accountID', req.account.id)
				.sort('posted ASC')
				.limit(postsPerPage + 1) // add one so we can see if there are some past
				// this page
				.offset(start)
		);

		if (results.length === 0 && start !== 0) {
			res.send(400);
			return;
		}

		json<BlogPostList>(res, {
			displayLeft: start !== 0,
			displayRight: results.length > postsPerPage,
			posts: results.slice(0, 15)
		});
	} else {
		res.status(400);
		res.end();
	}
};