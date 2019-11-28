import { MemberCreateError, SigninReturn } from 'common-lib';
import * as express from 'express';
import {
	AccountRequest,
	asyncErrorHandler,
	json,
	resolveReference,
	trySignin
} from '../lib/internals';

export default asyncErrorHandler(async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.body.username !== 'string' ||
		typeof req.body.password !== 'string' ||
		typeof req.body.recaptcha !== 'string'
	) {
		res.status(400);
		res.end();
		return;
	}

	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	const {
		username,
		password,
		recaptcha
	}: { username: string; password: string; recaptcha: string } = req.body;

	const signinResult = await trySignin(req.mysqlx, username, password, recaptcha);

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

			json<SigninReturn>(res, {
				error: MemberCreateError.NONE,
				member: member.toRaw(),
				sessionID: signinResult.sessionID,
				notificationCount,
				taskCount
			});
		} else if (signinResult.result === MemberCreateError.PASSWORD_EXPIRED) {
			json<SigninReturn>(res, {
				error: MemberCreateError.PASSWORD_EXPIRED,
				sessionID: signinResult.sessionID
			});
		} else {
			res.status(400);
			json<SigninReturn>(res, {
				error: signinResult.result
			});
		}
	} catch (e) {
		res.status(500);
		json<SigninReturn>(res, {
			error: MemberCreateError.UNKOWN_SERVER_ERROR
		});
	}
});
