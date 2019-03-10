import { NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../../lib/Members';
import { Notification } from '../../../lib/Notification';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		res.status(400);
		return res.end();
	}

	const id = parseInt(req.params.id, 10);

	try {
		const notification = await Notification.Get(
			id,
			{
				type: NotificationTargetType.ADMINS,
				accountID: req.account.id
			},
			req.account,
			req.mysqlx
		);

		json<NotificationObject>(res, notification.toRaw());
	} catch (e) {
		res.status(404);
		res.end();
	}
});
