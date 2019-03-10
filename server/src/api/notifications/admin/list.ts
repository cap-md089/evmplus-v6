import { NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../../lib/Members';
import { Notification } from '../../../lib/Notification';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	if (!req.account.isAdmin(req.member)) {
		res.status(403);
		return res.end();
	}

	const notifications = await Notification.GetFor(
		{
			type: NotificationTargetType.ADMINS,
			accountID: req.account.id
		},
		req.account,
		req.mysqlx
	);

	const easyReturn = notifications.map(notification => notification.toRaw());

	json<NotificationObject[]>(res, easyReturn);
});
