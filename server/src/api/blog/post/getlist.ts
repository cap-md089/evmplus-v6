import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { findAndBind, generateResults } from '../../../lib/MySQLUtil';
import { streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	const blogPostCollection = req.mysqlx.getCollection<BlogPostObject>('Blog');

	const blogPosts = generateResults(
		findAndBind(blogPostCollection, { accountID: req.account.id })
	);

	streamAsyncGeneratorAsJSONArray<BlogPostObject>(res, blogPosts);
};
