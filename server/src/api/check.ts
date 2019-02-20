import * as express from 'express';
import { MemberCreateError } from '../enums';
import { ConditionalMemberRequest } from '../lib/MemberBase';
import { json } from '../lib/Util';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	if (!!req.member) {
		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			sessionID: req.member.sessionID,
			member: req.member.toRaw(),
			valid: true,
			notificationCount: await req.member.getNotificationCount()
		});
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID,
			valid: false,
			sessionID: '',
			member: null,
			notificationCount: 0
		});
	}
};
