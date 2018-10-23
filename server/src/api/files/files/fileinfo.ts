import * as express from 'express';
import { FileUserAccessControlPermissions } from '../../../../../lib/index';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import CAPWATCHMember from '../../../lib/members/CAPWATCHMember';
import ProspectiveMember from '../../../lib/members/ProspectiveMember';
import { json } from '../../../lib/Util';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
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
		let uploader;

		if (file.owner.kind === 'NHQMember') {
			uploader = {
				kind: 'NHQMember' as 'NHQMember',
				object: await CAPWATCHMember.Get(
					file.owner.id,
					req.account,
					req.mysqlx
				)
			};
		} else if (file.owner.kind === 'ProspectiveMember') {
			uploader = {
				kind: 'ProspectiveMember' as 'ProspectiveMember',
				object: await ProspectiveMember.Get(
					file.owner.id,
					req.account,
					req.mysqlx
				)
			};
		}

		json<FullFileObject>(res, {
			...file.toRaw(),
			uploader
		});
	} else {
		json<FileObject>(res, file.toRaw());
	}
};
