import * as express from 'express';
import { MemberRequest } from "../lib/BaseMember";
import { json } from '../lib/Util';
import { SigninReturn } from './signin';

export default (req: MemberRequest, res: express.Response) => {
	if (!!req.member) {
		json<SigninReturn>(res, {
			error: -1,
			valid: true,
			sessionID: req.member.sessionID,
			member: req.member.createTransferable()
		});
	} else {
		json<SigninReturn>(res, {
			error: 'Invalid session ID',
			valid: false,
			sessionID: '',
			member: null
		});
	}
}