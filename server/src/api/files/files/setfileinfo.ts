import * as express from 'express';
import { FileObjectValidator } from '..';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';

export default (fileValidator: FileObjectValidator) => (async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		req.is('json') &&
		typeof req.account !== 'undefined' &&
		// typeof req.member !== 'undefined' &&
		typeof req.params.fileid !== 'undefined' &&
		fileValidator(req.body)
	) {
		const {
			fileName,
			comments,
			memberOnly,
			forDisplay,
			forSlideshow
		} = req.body;

		const newFile = {
			fileName,
			comments,
			forDisplay,
			forSlideshow,
			memberOnly,
		};

		const filesCollection = req.mysqlx.getCollection('Files');

		await filesCollection
			.modify('id = :id AND accountID = :accountID')
			.bind({
				id: req.params.id,
				accountID: req.account.id
			})
			.patch(newFile)
			.execute();

		res.status(204);
		res.end();
	} else {
		res.status(400);
		res.end();
	}
});