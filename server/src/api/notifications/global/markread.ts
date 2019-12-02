import { just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, GlobalNotification } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string }>) => {
	if (!req.account.isAdmin(req.member)) {
		return left({
			code: 403,
			error: none<Error>(),
			message: 'Member does not have permission to perform the requested action'
		});
	}

	try {
		const notification = await GlobalNotification.GetCurrent(req.account, req.mysqlx);

		notification.markAsRead();

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
			message: 'Could not find global notification'
		});
	}
});
