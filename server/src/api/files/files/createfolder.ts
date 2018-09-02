import * as express from 'express';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		typeof req.account !== 'undefined' &&
		typeof req.member !== 'undefined'
	) {
		const id = uuid();

		const fileCollection = req.mysqlx.getCollection<FileObject>('Files');

		await fileCollection
			.add({
				accountID: req.account.id,
				comments: '',
				contentType: 'application/folder',
				created: Math.floor(+DateTime.utc() / 1000),
				fileName: req.params.name,
				forDisplay: false,
				forSlideshow: false,
				id,
				kind: 'drive#file',
				memberOnly: false,
				uploaderID: req.member.id,
				fileChildren: [],
				parentID: 'root'
			})
			.execute();

		res.send(204);
	} else {
		res.status(400);
		res.end();
	}
};
