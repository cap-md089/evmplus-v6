import * as express from 'express';
import { MemberCreateError } from '../enums';
import { MemberRequest } from '../lib/MemberBase';
import { json } from '../lib/Util';

export default (req: MemberRequest, res: express.Response) => {
	if (!!req.member) {
		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			valid: true,
			sessionID: req.member.sessionID,
			member: req.member.toRaw()
		});
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID,
			valid: false,
			sessionID: '',
			member: null
		});
	}
};
