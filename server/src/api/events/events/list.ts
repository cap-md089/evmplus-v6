import * as express from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	Event,
	streamAsyncGeneratorAsJSONArray
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray<Event>(res, req.account.getEvents(), e =>
		JSON.stringify(e.toRaw(req.member))
	);
});
