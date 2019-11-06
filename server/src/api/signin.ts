import { MemberCreateError, SigninReturn, SuccessfulSigninReturn } from 'common-lib';
import * as express from 'express';
import {
	AccountRequest,
	asyncErrorHandler,
	json,
	resolveReference,
	trySignin
} from '../lib/internals';

export default asyncErrorHandler(async (req: AccountRequest, res: express.Response) => {
	const {
		username,
		password,
		recaptcha
	}: { username: string | number; password: string; recaptcha: string } = req.body;
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	username.toString();

	const signinResult = await trySignin(req.mysqlx, username.toString(), password, recaptcha);

	try {
		if (signinResult.result === MemberCreateError.NONE) {
			const member = await resolveReference(
				signinResult.member,
				req.account,
				req.mysqlx,
				true
			);

			const [notificationCount, taskCount] = await Promise.all([
				member.getUnreadNotificationCount(),
				member.getUnfinishedTaskCount()
			]);

			json<SuccessfulSigninReturn>(res, {
				error: MemberCreateError.NONE,
				member: member.toRaw(),
				sessionID: signinResult.sessionID,
				valid: true,
				notificationCount,
				taskCount
			});
		} else {
			res.status(400);
			json<SigninReturn>(res, {
				error: signinResult.result,
				member: null,
				sessionID: '',
				valid: false,
				notificationCount: 0,
				taskCount: 0
			});
		}
	} catch (e) {
		res.status(500);
		json<SigninReturn>(res, {
			error: MemberCreateError.UNKOWN_SERVER_ERROR,
			member: null,
			sessionID: '',
			valid: false,
			notificationCount: 0,
			taskCount: 0
		});
	}
});
