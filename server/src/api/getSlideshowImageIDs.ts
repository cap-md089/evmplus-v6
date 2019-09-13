import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	streamAsyncGeneratorAsJSONArray
} from '../lib/internals';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	await streamAsyncGeneratorAsJSONArray(res, req.account.getFiles(), async file =>
		file.forSlideshow &&
		!(await file.hasPermission(
			req.member,
			req.mysqlx,
			req.account,
			FileUserAccessControlPermissions.READ
		))
			? JSON.stringify(file.toRaw())
			: false
	);
});
