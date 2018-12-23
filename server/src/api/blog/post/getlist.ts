import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default asyncErrorHandler(async (req: AccountRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray<BlogPost>(
		res,
		req.account.getBlogPosts(),
		val => JSON.stringify(val.toRaw())
	);
});
