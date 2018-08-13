import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import Member from '../lib/members/NHQMember';
import { json } from '../lib/Util';

interface SuccessfulSigninReturn {
	error: -1;
	member: MemberObject;
	sessionID: string;
	valid: true;
}

interface FailedSigninReturn {
	error: number;
	member: null;
	sessionID: string;
	valid: false;
}

export type SigninReturn = SuccessfulSigninReturn | FailedSigninReturn;

export default (req: AccountRequest, res: express.Response) => {
	const {
		username,
		password
	}: { username: string | number; password: string } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	Member.Create(
		typeof username === 'number' ? username.toString() : username,
		password,
		req.mysqlx,
		req.account
	).then(member => {
		json<SigninReturn>(res, {
			error: -1,
			member: member.toRaw(),
			sessionID: member.sessionID,
			valid: true
		});
	}).catch((errors: Error) => {
		if (errors.message.match(/^(\d)*$/)) {
			// tslint:disable-next-line
			console.log(errors);
			res.status(500);
			res.end();
		} else {
			res.status(400);
			json<SigninReturn>(res, {
				error: parseInt(errors.message, 10),
				member: null,
				sessionID: '',
				valid: false
			});
		}
	});
};
