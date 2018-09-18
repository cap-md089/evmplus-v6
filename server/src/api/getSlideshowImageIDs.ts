import * as express from 'express';
import { MemberRequest } from '../lib/MemberBase';
import { streamAsyncGeneratorAsJSONArray } from '../lib/Util';

export default (req: MemberRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray(
		res,
		req.account.getFiles(),
		file =>
			file.forSlideshow && !(file.memberOnly && req.member === null)
				? JSON.stringify(file.toRaw())
				: false
	);
};
