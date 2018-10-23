import * as express from 'express';
import { FileUserAccessControlPermissions } from '../../../../../lib/index';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import CAPWATCHMember from '../../../lib/members/CAPWATCHMember';
import ProspectiveMember from '../../../lib/members/ProspectiveMember';
import { streamAsyncGeneratorAsJSONArrayTyped } from '../../../lib/Util';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	const parentid =
		typeof req.params.parentid === 'undefined'
			? 'root'
			: req.params.parentid;
	const method =
		typeof req.params.method === 'undefined' ? 'clean' : req.params.method;
	if (['clean', 'dirty'].indexOf(method) === -1) {
		res.status(400);
		res.end();
		return;
	}

	let folder;

	try {
		folder = await File.Get(parentid, req.account, req.mysqlx);
	} catch (e) {
		// tslint:disable-next-line
		console.log(e);
		res.status(404);
		res.end();
		return;
	}

	if (
		!(await folder.hasPermission(
			req.member,
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
		streamAsyncGeneratorAsJSONArrayTyped<File, FullFileObject>(
			res,
			folder.getChildren(),
			async file => {
				const canRead = await file.hasPermission(
					req.member,
					FileUserAccessControlPermissions.READ
				);
				if (!canRead) {
					return false;
				}

				let uploader;
				if (file.owner.kind === 'ProspectiveMember') {
					uploader = {
						kind: 'ProspectiveMember' as 'ProspectiveMember',
						object: await ProspectiveMember.Get(
							file.owner.id,
							req.account,
							req.mysqlx
						)
					};
				} else if (file.owner.kind === 'NHQMember') {
					uploader = {
						kind: 'NHQMember' as 'NHQMember',
						object: await CAPWATCHMember.Get(
							file.owner.id,
							req.account,
							req.mysqlx
						)
					};
				}

				const fullFile: FullFileObject = {
					...file.toRaw(),
					uploader
				};

				return fullFile;
			}
		);
	} else {
		streamAsyncGeneratorAsJSONArrayTyped<File, FileObject>(
			res,
			folder.getChildren(),
			async file =>
				(await file.hasPermission(
					req.member,
					FileUserAccessControlPermissions.READ
				))
					? file.toRaw()
					: false
		);
	}
};
