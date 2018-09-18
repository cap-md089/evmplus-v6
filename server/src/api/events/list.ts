import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import Event from '../../lib/Event';
import { streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray<Event>(res, req.account.getEvents(), e =>
		JSON.stringify(e.toRaw())
	);
};
