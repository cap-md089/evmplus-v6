import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import Member from '../lib/members/NHQMember';

export default (req: AccountRequest, res: express.Response) => {
	const { username, password } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}
	Member.Create(username, password, req.connectionPool, req.account).then(member => {
		res.json({
			error: -1,
			member,
			sessionID: member.sessionID,
			valid: true
		});
	}).catch((errors: Error) => {
		res.json({
			error: errors.message,
			sessionID: '',
			valid: false
		});
	});
};