import { NotificationObject } from 'common-lib';
import { asyncErrorHandler, GlobalNotification, json, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	try {
		const notification = await GlobalNotification.GetCurrent(req.account, req.mysqlx);

		json<NotificationObject>(res, notification.toFullRaw());
	} catch (e) {
		res.status(404);
		res.end();
	}
});
