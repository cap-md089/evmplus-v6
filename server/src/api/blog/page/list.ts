import { Response } from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPage from '../../../lib/BlogPage';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default asyncErrorHandler(async (req: AccountRequest, res: Response) => {
	await streamAsyncGeneratorAsJSONArray<BlogPage>(
		res,
		req.account.getBlogPages(),
		val => JSON.stringify(val.toRaw())
	);
});