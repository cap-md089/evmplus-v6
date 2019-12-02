import { api, left, none, NotificationTargetType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../../lib/internals';

export default asyncEitherHandler<api.notifications.member.Get>(
	async (req: BasicMemberRequest<{ id: string }>) => {
		if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid ID passed'
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

			if (!notification.canSee(req.member, req.account)) {
				return left({
					code: 403,
					error: none<Error>(),
					message: 'Member does not have permission to view the requested notification'
				});
			}

			return right(notification.toFullRaw());
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find notification'
			});
		}
	}
);
