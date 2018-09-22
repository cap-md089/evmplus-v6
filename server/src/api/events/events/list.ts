import * as express from 'express';
import Event from '../../../lib/Event';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray<Event>(res, req.account.getEvents(), e =>
		JSON.stringify(e.toRaw(req.member))
	);
};
