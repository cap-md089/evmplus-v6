import { Response } from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPage from '../../../lib/BlogPage';
import { streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default async (req: AccountRequest, res: Response) => {
	streamAsyncGeneratorAsJSONArray<BlogPage>(
		res,
		req.account.getBlogPages(),
		val => JSON.stringify(val.toRaw())
	);
};
