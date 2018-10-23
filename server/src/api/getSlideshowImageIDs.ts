import * as express from 'express';
import { FileUserAccessControlPermissions } from '../../../lib/index';
import { ConditionalMemberRequest } from '../lib/MemberBase';
import { streamAsyncGeneratorAsJSONArray } from '../lib/Util';

export default (req: ConditionalMemberRequest, res: express.Response) => {
	streamAsyncGeneratorAsJSONArray(
		res,
		req.account.getFiles(),
		async file =>
			file.forSlideshow &&
			!(await file.hasPermission(
				req.member,
				FileUserAccessControlPermissions.READ
			))
				? JSON.stringify(file.toRaw())
				: false
	);
};
