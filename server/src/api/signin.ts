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
	error: string;
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
		json<SigninReturn>(res, {
			error: errors.message,
			member: null,
			sessionID: '',
			valid: false
		});
	});
};
