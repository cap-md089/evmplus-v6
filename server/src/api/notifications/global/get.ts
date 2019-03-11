import { NotificationObject } from 'common-lib';
import { MemberRequest } from '../../../lib/Members';
import GlobalNotification from '../../../lib/notifications/GlobalNotification';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	try {
		const notification = await GlobalNotification.GetCurrent(req.account, req.mysqlx);

		json<NotificationObject>(res, notification.toFullRaw());
	} catch (e) {
		res.status(404);
		res.end();
	}
});
