import { FullFileObject, RawFileObject } from 'common-lib';
import { FileUserAccessControlPermissions, FileUserAccessControlType } from 'common-lib/index';
import * as express from 'express';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { asyncErrorHandler, File, json, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res: express.Response) => {
	const root = await File.Get('root', req.account, req.mysqlx);

	if (
		!(await root.hasPermission(
			req.member,
			req.mysqlx,
			req.account,
			FileUserAccessControlPermissions.MODIFY
		))
	) {
		res.status(403);
		res.end();
		return;
	}

	if (req.body === undefined || req.body.name === undefined) {
		res.status(400);
		res.end();
		return;
	}

	const id = uuid().replace(/-/g, '');

	const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

	const reference = req.member.getReference();

	await fileCollection
		.add({
			accountID: req.account.id,
			comments: '',
			contentType: 'application/folder',
			created: +DateTime.utc(),
			fileName: req.body.name,
			forDisplay: false,
			forSlideshow: false,
			id,
			kind: 'drive#file',
			permissions: [
				{
					type: FileUserAccessControlType.USER,
					reference,
					permission: FileUserAccessControlPermissions.FULLCONTROL
				}
			],
			owner: reference,
			fileChildren: [],
			parentID: 'root'
		})
		.execute();

	const file = await File.Get(id, req.account, req.mysqlx);

	json<FullFileObject>(res, {
		...file.toRaw(),
		uploader: req.member.toRaw()
	});
});
