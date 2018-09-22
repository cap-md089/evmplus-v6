import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import { streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray(res, req.account.getMembers(), mem =>
		JSON.stringify(mem.toRaw())
	);
};
