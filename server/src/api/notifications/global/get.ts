import { api, just, none, NotificationObject, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, GlobalNotification } from '../../../lib/internals';

export default asyncEitherHandler<api.notifications.global.Get>(
	async (req: BasicMemberRequest<{ id: string }>) => {
		try {
			const notification = await GlobalNotification.GetCurrent(req.account, req.mysqlx);

			return right(just(notification.toFullRaw()));
		} catch (e) {
			return right(none<NotificationObject>());
		}
	}
);
