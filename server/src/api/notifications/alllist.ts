import { NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../lib/Members';
import GlobalNotification from '../../lib/notifications/GlobalNotification';
import { asyncErrorHandler, json } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	const notifications = [];

	try {
		notifications.push(await GlobalNotification.GetCurrent(req.account, req.mysqlx));
	} catch (e) {
		// There is no current global notification
	}

	const memberNotifications = await GlobalNotification.GetFor(
		{
			type: NotificationTargetType.MEMBER,
			to: req.member.getReference()
		},
		req.account,
		req.mysqlx
	);

	for (const i of memberNotifications) {
		if (i.canSee(req.member, req.account)) {
			notifications.push(i);
		}
	}

	if (!req.account.isAdmin(req.member)) {
		return json<NotificationObject[]>(res, notifications.map(notif => notif.toFullRaw()));
	}

	const adminNotifications = await GlobalNotification.GetFor(
		{
			type: NotificationTargetType.ADMINS,
			accountID: req.account.id
		},
		req.account,
		req.mysqlx
	);

	for (const i of adminNotifications) {
		if (i.canSee(req.member, req.account)) {
			notifications.push(i);
		}
	}

	json<NotificationObject[]>(res, notifications.map(notif => notif.toFullRaw()));
});
