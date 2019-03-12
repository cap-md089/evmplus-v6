import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../lib/Members';
import GlobalNotification from '../../lib/notifications/GlobalNotification';
import MemberNotification from '../../lib/notifications/MemberNotification';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	res.header('Content-type', 'application/json');
	let started = false;

	const memberNotificationsGenerator = MemberNotification.StreamFor(
		{
			type: NotificationTargetType.MEMBER,
			to: req.member.getReference()
		},
		req.account,
		req.mysqlx
	);

	for await (const i of memberNotificationsGenerator) {
		if (i.canSee(req.member, req.account)) {
			res.write((started ? ',' : '[') + JSON.stringify(i.toFullRaw()));
			started = true;
		}
	}

	if (!req.account.isAdmin(req.member)) {
		if (!started) {
			res.write('[');
		}

		res.write(']');
		res.end();

		return;
	}

	const adminNotificationsGenerator = GlobalNotification.StreamFor(
		{
			type: NotificationTargetType.ADMINS,
			accountID: req.account.id
		},
		req.account,
		req.mysqlx
	);

	for await (const i of adminNotificationsGenerator) {
		if (i.canSee(req.member, req.account)) {
			res.write((started ? ',' : '[') + JSON.stringify(i.toFullRaw()));
			started = true;
		}
	}

	if (!started) {
		res.write('[');
	}

	res.write(']');
	res.end();
});
