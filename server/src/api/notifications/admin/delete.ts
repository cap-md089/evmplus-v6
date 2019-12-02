import { just, left, none, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string }>) => {
	if (!req.account.isAdmin(req.member)) {
		return left({
			code: 403,
			error: none<Error>(),
			message: 'Member does not have permission to perform the requested action'
		});
	}

	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		return left({
			code: 400,
			error: none<Error>(),
			message: 'Invalid notification ID provided'
		});
	}

	const id = parseInt(req.params.id, 10);

	try {
		const notification = await Notification.GetOfTarget(
			id,
			{
				type: NotificationTargetType.ADMINS,
				accountID: req.account.id
			},
			req.account,
			req.mysqlx
		);

		notification.markAsRead();

		try {
			await notification.delete();
		} catch (e) {
			return left({
				code: 50,
				error: just(e),
				message: 'Unknown server error'
			});
		}

		return right(void 0);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find the notification specified'
		});
	}
});
