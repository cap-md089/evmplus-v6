import {
	MemberCreateError,
	NHQMemberObject,
	ProspectiveMemberObject,
	SigninReturn
} from 'common-lib';
import * as express from 'express';
import { ConditionalMemberRequest, json } from '../lib/internals';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	if (!!req.member) {
		const [taskCount, notificationCount] = await Promise.all([
			req.member.getUnreadNotificationCount(),
			req.member.getUnfinishedTaskCount()
		]);

		const member = req.member.toRaw() as ProspectiveMemberObject | NHQMemberObject;

		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			sessionID: req.member.sessionID,
			member,
			notificationCount,
			taskCount
		});
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID
		});
	}
};
