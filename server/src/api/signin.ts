import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import Member from '../lib/members/NHQMember';
import { json } from '../lib/Util';
import { MemberObject } from '../types';

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
	const { username, password } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}
	Member.Create(username, password, req.connectionPool, req.account).then(member => {
		json<SigninReturn>(res, {
			error: -1,
			member: member.createTransferable(),
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