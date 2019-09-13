import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import { ConditionalMemberRequest } from '../lib/Members';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray(res, req.account.getFiles(), async file =>
		file.forSlideshow && !await file.hasPermission(req.member, req.mysqlx, req.account, FileUserAccessControlPermissions.READ)
			? JSON.stringify(file.toRaw())
			: false
	);
});
