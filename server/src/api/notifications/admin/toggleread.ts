import { api, just, left, none, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler<api.notifications.ToggleRead>(
	async (req: BasicMemberRequest<{ id: string }>) => {
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
				message: 'Invalid ID provided'
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

			if (notification.read) {
				notification.markAsUnread();
			} else {
				notification.markAsRead();
			}

			try {
				await notification.save();
			} catch (e) {
				return left({
					code: 500,
					error: just(e),
					message: 'Could not save notification state'
				});
			}

			return right(void 0);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find notification requested'
			});
		}
	}
);
