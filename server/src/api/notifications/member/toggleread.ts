import { api, just, left, none, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler<api.notifications.member.ToggleRead>(
	async (req: BasicMemberRequest<{ id: string }>) => {
		if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid ID passed as a parameter'
			});
		}

		const id = parseInt(req.params.id, 10);

		try {
			const notification = await Notification.GetOfTarget(
				id,
				{
					type: NotificationTargetType.MEMBER,
					to: req.member.getReference()
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
					message: 'Could not save notification information'
				});
			}

			return right(void 0);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find notification information'
			});
		}
	}
);
