import { api, just, left, none, NotificationCauseType, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, GlobalNotification } from '../../../lib/internals';

export default asyncEitherHandler<api.notifications.global.Create>(
	async (req: BasicMemberRequest) => {
		if (!req.account.isAdmin(req.member)) {
			return left({
				code: 403,
				error: none<Error>(),
				message: 'Member does not have permission to perform the requested action'
			});
		}

		if (typeof req.body.text !== 'string' || typeof req.body.expires !== 'number') {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'A global notification requires a valid expire date and message'
			});
		}

		if (await GlobalNotification.AccountHasGlobalNotificationActive(req.account, req.mysqlx)) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'You cannot have multiple global notifications in effect at once'
			});
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
				await req.account.getRegistry(),
				req.member
			);

			return right(notification.toFullRaw());
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not create global notification'
			});
		}
	}
);
