import * as express from 'express';
import Event from '../../../lib/Event';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray<Event>(res, req.account.getEvents(), e =>
		JSON.stringify(e.toRaw(req.member))
	);
});
