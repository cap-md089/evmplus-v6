import { FullBlogPageObject } from 'common-lib';
import { Response } from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPage from '../../../lib/BlogPage';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArrayTyped } from '../../../lib/Util';

export default asyncErrorHandler(async (req: AccountRequest, res: Response) => {
	await streamAsyncGeneratorAsJSONArrayTyped<BlogPage, FullBlogPageObject>(
		res,
		req.account.getBlogPages(),
		val => val.toFullRaw()
	);
});
