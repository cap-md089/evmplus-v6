import { asyncErrorHandler, GlobalNotification, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (!req.account.isAdmin(req.member)) {
		res.status(403);
		return res.end();
	}

	try {
		const notification = await GlobalNotification.GetCurrent(req.account, req.mysqlx);

		notification.markAsRead();

		await notification.save();

		res.status(200);
		res.end();
	} catch (e) {
		res.status(404);
		res.end();
	}
});
