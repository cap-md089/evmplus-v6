import { just, left, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest) => {
	let notifications;
	try {
		notifications = await Notification.GetFor(
			{
				type: NotificationTargetType.MEMBER,
				to: req.member.getReference()
			},
			req.account,
			req.mysqlx
		);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not get notifications'
		});
	}

	const easyReturn = notifications.map(notification => notification.toFullRaw());

	return right(easyReturn);
});
