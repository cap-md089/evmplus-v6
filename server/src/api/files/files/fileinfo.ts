import * as express from 'express';
import { FileUserAccessControlPermissions } from '../../../../../lib/index';
import File from '../../../lib/File';
import MemberBase, { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	if (
		typeof req.params === 'undefined' ||
		typeof req.params.fileid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	let file: File;

	try {
		file = await File.Get(req.params.fileid, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (
		!(await file.hasPermission(
			req.member,
			FileUserAccessControlPermissions.READ
		))
	) {
		res.send(403);
		res.end();
		return;
	}

	if (
		req.params.method &&
		req.params.method === 'dirty' &&
		req.member !== null
	) {
		const member = await MemberBase.ResolveReference(
			file.owner,
			req.account,
			req.mysqlx
		);

		json<FullFileObject>(res, {
			...file.toRaw(),
			uploader: member.toRaw()
		});
	} else {
		json<FileObject>(res, file.toRaw());
	}
});
