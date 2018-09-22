import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import Member, { MemberCreateError } from '../lib/members/NHQMember';
import ProspectiveMember from '../lib/members/ProspectiveMember';
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
		let member;

		const userID = username.toString();
		
		if (userID.match(/([0-9]{6})/)) {
			member = await Member.Create(
				userID,
				password,
				req.mysqlx,
				req.account
			);
		} else {
			member = await ProspectiveMember.Signin(
				userID,
				password,
				req.account,
				req.mysqlx
			)
		}

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
