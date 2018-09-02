import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import Member, { MemberCreateError } from '../lib/members/NHQMember';
import { json } from '../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	const {
		username,
		password
	}: { username: string | number; password: string } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	try {
		const member = await Member.Create(
			typeof username === 'number' ? username.toString() : username,
			password,
			req.mysqlx,
			req.account
		);

		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			member: member.toRaw(),
			sessionID: member.sessionID,
			valid: true
		});
	} catch (errors) {
		if (!errors.message.match(/^(\d)*$/)) {
			console.error(errors);
			res.status(500);
			json<SigninReturn>(res, {
				error: MemberCreateError.UNKOWN_SERVER_ERROR,
				member: null,
				sessionID: '',
				valid: false
			});
		} else {
			res.status(400);
			json<SigninReturn>(res, {
				error: parseInt(errors.message, 10),
				member: null,
				sessionID: '',
				valid: false
			});
		}
	}
};
