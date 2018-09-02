import * as express from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import { streamAsyncGeneratorAsJSON } from '../../lib/Util';

export default async (req: MemberRequest, res: express.Response) => {
	if (req.account !== null) {
		streamAsyncGeneratorAsJSON(res, req.account.getMembers(), mem =>
			JSON.stringify(mem.toRaw())
		);
	} else {
		res.status(400);
		res.end();
	}
};
