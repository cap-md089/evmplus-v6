import * as express from 'express';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	MemberCreateError
} from '../../../../../lib/index';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { json } from '../../../lib/Util';

export default async (req: MemberRequest, res: express.Response) => {
	const root = await File.Get('root', req.account, req.mysqlx);

	if (
		!root.hasPermission(req.member, FileUserAccessControlPermissions.MODIFY)
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

	const id = uuid();

	const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

	const reference = req.member.getReference();

	await fileCollection
		.add({
			accountID: req.account.id,
			comments: '',
			contentType: 'application/folder',
			created: Math.floor(+DateTime.utc() / 1000),
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
		uploader: {
			error: MemberCreateError.NONE,
			member: req.member.toRaw(),
			sessionID: '',
			valid: true
		}
	});
};
