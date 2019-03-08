import { Schema } from '@mysql/xdevapi';
import {
	NoSQLDocument,
	NotificationCause,
	NotificationObject,
	RawNotificationObject
} from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import Account from '../Account';
import { findAndBind, generateResults } from '../MySQLUtil';
import { Notification } from '../Notification';

export default class AdminNotification extends Notification {
	public static async CreateNotification(
		text: string,
		from: NotificationCause,
		account: Account,
		schema: Schema
	) {
		const accountNotifications = schema.getCollection<RawNotificationObject>('Notifications');

		let id: number = 0;

		const notifGenerator = generateResults(
			findAndBind(accountNotifications, {
				accountID: account.id,
				target: {
					type: NotificationTargetType.ADMINS
				}
			})
		);

		for await (const notif of notifGenerator) {
			id = Math.max(notif.id, id);
		}

		id++;

		const results = await this.Create(
			{
				cause: from,
				text
			},
			id,
			{
				type: NotificationTargetType.ADMINS
			},
			account,
			schema
		);

		return new AdminNotification(results, account, schema);
	}

	protected constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);
	}
}
