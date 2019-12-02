import { just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Notification } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string }>) => {
	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		return left({
			code: 400,
			error: none<Error>(),
			message: 'Invalid ID provided as a parameter'
		});
	}

	const id = parseInt(req.params.id, 10);

	let notification;

	try {
		notification = await Notification.Get(id, req.account, req.mysqlx);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find notification'
		});
	}

	if (!notification.canSee(req.member, req.account)) {
		return left({
			code: 403,
			error: none<Error>(),
			message: 'Member does not have permission to view notification'
		});
	}

	if (notification.read) {
		notification.markAsUnread();
	} else {
		notification.markAsRead();
	}

	try {
		await notification.save();

		return right(void 0);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not save notification information'
		});
	}
});
