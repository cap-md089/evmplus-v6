import { Schema } from '@mysql/xdevapi';
import { NoSQLDocument, NotificationCause, NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import Account from '../Account';
import { Notification } from '../Notification';

export default class GlobalNotification extends Notification {
	public static async CreateNotification(
		text: string,
		from: NotificationCause,
		account: Account,
		schema: Schema
	) {
		const results = await this.Create(
			{
				cause: from,
				text
			},
			{
				type: NotificationTargetType.ADMINS,
				accountID: account.id
			},
			account,
			schema
		);

		return new GlobalNotification(results, account, schema);
	}

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);
	}
}
