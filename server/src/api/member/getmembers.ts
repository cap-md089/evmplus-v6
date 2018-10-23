import * as express from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import { streamAsyncGeneratorAsJSONArray } from '../../lib/Util';

export default async (req: MemberRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray(res, req.account.getMembers(), mem =>
		JSON.stringify(mem.toRaw())
	);
};
