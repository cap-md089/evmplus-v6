import * as express from 'express';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType
} from '../../../../../lib/index';
import { MemberRequest } from '../../../lib/MemberBase';
import ProspectiveMember from '../../../lib/members/ProspectiveMember';

export default async (req: MemberRequest, res: express.Response) => {
	if (
		req.member === null ||
		req.body === undefined ||
		req.body.name === undefined
	) {
		res.status(403);
		res.end();
		return;
	}

	const id = uuid();

	const fileCollection = req.mysqlx.getCollection<RawFileObject>('Files');

	const reference: MemberReference =
		req.member instanceof ProspectiveMember
			? {
					id: req.member.prospectiveID,
					kind: 'ProspectiveMember'
			  }
			: {
					id: req.member.id,
					kind: 'NHQMember'
			  };

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
					permission:
						FileUserAccessControlPermissions.FULLCONTROL
				}
			],
			owner: reference,
			fileChildren: [],
			parentID: 'root'
		})
		.execute();

	res.json({
		id
	});
};
