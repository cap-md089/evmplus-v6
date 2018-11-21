import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import { streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray<BlogPost>(
		res,
		req.account.getBlogPosts(),
		val => JSON.stringify(val.toRaw())
	);
};
