import { MemberRequest } from '../../lib/Members';
import { Notification } from '../../lib/Notification';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		res.status(400);
		return res.end();
	}

	const id = parseInt(req.params.id, 10);

	try {
		const notification = await Notification.Get(id, req.account, req.mysqlx);

		if (!notification.canSee(req.member, req.account)) {
			res.status(403);
			return res.end();
		}

		notification.markAsRead();

		res.status(204);
		res.end();
	} catch (e) {
		res.status(404);
		res.end();
	}
});
