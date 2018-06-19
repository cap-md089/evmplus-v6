import * as express from 'express';
import Member from '../lib/members/NHQMember';
import { AccountRequest } from '../lib/Account';

export default (req: AccountRequest, res: express.Response, next: Function) => {
	let { username, password } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}
	Member.Create(username, password, req.connectionPool, req.account).then(member => {
		res.json({
			sessionID: member.sessionID,
			valid: true,
			error: -1,
			member
		});
	}).catch((errors: Error) => {
		console.log(errors);
		res.json({
			sessionID: '',
			valid: false,
			error: errors.message,
		});
	});
};