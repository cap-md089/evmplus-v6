import * as express from 'express';
import {
	asyncErrorHandler,
	MemberRequest,
	streamAsyncGeneratorAsJSONArray
} from '../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberRequest, res: express.Response) =>
		await streamAsyncGeneratorAsJSONArray(res, req.account.getMembers(), mem =>
			JSON.stringify(mem.toRaw())
		)
);
