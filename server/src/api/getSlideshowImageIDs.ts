import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import { ConditionalMemberRequest } from '../lib/MemberBase';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray(res, req.account.getFiles(), file =>
		file.forSlideshow && !file.hasPermission(req.member, FileUserAccessControlPermissions.READ)
			? JSON.stringify(file.toRaw())
			: false
	);
});
