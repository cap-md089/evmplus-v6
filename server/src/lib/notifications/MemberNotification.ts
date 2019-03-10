import { Schema } from '@mysql/xdevapi';
import { MemberReference, NoSQLDocument, NotificationCause, NotificationObject } from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import Account from '../Account';
import { Notification } from '../Notification';

export default class MemberNotification extends Notification {
	public static async CreateNotification(
		text: string,
		to: MemberReference,
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
				type: NotificationTargetType.MEMBER,
				to
			},
			account,
			schema
		);

		return new MemberNotification(results, account, schema);
	}

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);
	}
}
