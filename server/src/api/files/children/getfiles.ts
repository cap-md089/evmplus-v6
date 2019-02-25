import { FileObject, FullFileObject } from 'common-lib';
import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArrayTyped } from '../../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest, res: express.Response) => {
	const parentid = typeof req.params.parentid === 'undefined' ? 'root' : req.params.parentid;
	const method = typeof req.params.method === 'undefined' ? 'clean' : req.params.method;

	if (['clean', 'dirty'].indexOf(method) === -1) {
		res.status(400);
		res.end();
		return;
	}

	let folder;

	try {
		folder = await File.Get(parentid, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (!folder.hasPermission(req.member, FileUserAccessControlPermissions.READ)) {
		res.status(403);
		res.end();
		return;
	}

	if (req.params.method !== undefined && req.params.method === 'dirty' && req.member !== null) {
		await streamAsyncGeneratorAsJSONArrayTyped<File, FullFileObject>(
			res,
			folder.getChildren(),
			async file => {
				const canRead = file.hasPermission(
					req.member,
					FileUserAccessControlPermissions.READ
				);

				if (!canRead) {
					return false;
				}

				const fullFile = await file.toFullRaw();

				return fullFile;
			}
		);
	} else {
		await streamAsyncGeneratorAsJSONArrayTyped<File, FileObject>(
			res,
			folder.getChildren(),
			file =>
				file.hasPermission(req.member, FileUserAccessControlPermissions.READ)
					? file.toRaw()
					: false
		);
	}
});
