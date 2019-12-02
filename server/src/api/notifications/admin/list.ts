import { just, left, none, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest) => {
	if (!req.account.isAdmin(req.member)) {
		return left({
			code: 403,
			error: none<Error>(),
			message: 'Member does not have permission to perform the requested action'
		});
	}

	let notifications;
	try {
		notifications = await Notification.GetFor(
			{
				type: NotificationTargetType.ADMINS,
				accountID: req.account.id
			},
			req.account,
			req.mysqlx
		);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not get the notifications'
		});
	}

	const easyReturn = notifications.map(notification => notification.toFullRaw());

	return right(easyReturn);
});
