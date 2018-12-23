import * as express from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray(res, req.account.getMembers(), mem =>
		JSON.stringify(mem.toRaw())
	);
});
