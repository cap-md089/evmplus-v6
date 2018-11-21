import * as express from 'express';
import conf from '../conf';
import { AccountRequest } from '../lib/Account';
import MemberBase from '../lib/Members';
import { default as Member, MemberCreateError } from '../lib/members/NHQMember';
import ProspectiveMember from '../lib/members/ProspectiveMember';
import { json } from '../lib/Util';

export default (config: typeof conf) => async (
	req: AccountRequest,
	res: express.Response
) => {
	const {
		username,
		password
	}: { username: string | number; password: string } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	let member;

	try {
		const userID = username.toString();

		switch (MemberBase.GetMemberTypeFromID(userID)) {
			case 'CAPNHQMember':
				member = await Member.Create(
					userID,
					password,
					req.mysqlx,
					req.account
				);
				break;

			case 'CAPProspectiveMember':
				member = await ProspectiveMember.Signin(
					userID,
					password,
					req.account,
					req.mysqlx
				);
				break;
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
