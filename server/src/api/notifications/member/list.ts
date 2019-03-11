import { NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../../lib/Members';
import { Notification } from '../../../lib/Notification';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	const notifications = await Notification.GetFor(
		{
			type: NotificationTargetType.MEMBER,
			to: req.member.getReference()
		},
		req.account,
		req.mysqlx
	);

	const easyReturn = notifications.map(notification => notification.toFullRaw());

	json<NotificationObject[]>(res, easyReturn);
});
