import { FileObject, FullFileObject } from 'common-lib';
import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	File,
	streamAsyncGeneratorAsJSONArrayTyped
} from '../../../lib/internals';

export default asyncErrorHandler(
	async (
		req: ConditionalMemberRequest<{ parentid: string; method: string }>,
		res: express.Response
	) => {
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

		if (
			!(await folder.hasPermission(
				req.member,
				req.mysqlx,
				req.account,
				FileUserAccessControlPermissions.READ
			))
		) {
			res.status(403);
			res.end();
			return;
		}

		if (
			req.params.method !== undefined &&
			req.params.method === 'dirty' &&
			req.member !== null
		) {
			await streamAsyncGeneratorAsJSONArrayTyped<File, FullFileObject>(
				res,
				folder.getChildren(),
				async file => {
					const canRead = await file.hasPermission(
						req.member,
						req.mysqlx,
						req.account,
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
					file.hasPermission(
						req.member,
						req.mysqlx,
						req.account,
						FileUserAccessControlPermissions.READ
					)
						? file.toRaw()
						: false
			);
		}
	}
);
