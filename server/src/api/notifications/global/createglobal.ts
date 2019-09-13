import { NotificationObject } from 'common-lib';
import { NotificationCauseType } from 'common-lib/index';
import { asyncErrorHandler, GlobalNotification, json, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	if (!req.account.isAdmin(req.member)) {
		res.status(403);
		return res.end();
	}

	if (typeof req.body.text !== 'string' || typeof req.body.expires !== 'number') {
		res.status(400);
		return res.end();
	}

	if (await GlobalNotification.AccountHasGlobalNotificationActive(req.account, req.mysqlx)) {
		res.status(400);
		return res.end();
	}

	try {
		const notification = await GlobalNotification.CreateNotification(
			req.body.text,
			req.body.expires,
			{
				from: req.member.getReference(),
				type: NotificationCauseType.MEMBER
			},
			req.account,
			req.mysqlx,
			req.member
		);

		json<NotificationObject>(res, notification.toFullRaw());
	} catch (e) {
		res.status(404);
		res.end();
	}
});
