import { Schema } from '@mysql/xdevapi';
import {
	NewNotificationObject,
	NoSQLDocument,
	NotificationCause,
	NotificationObject,
	NotificationTarget,
	RawNotificationObject
} from 'common-lib';
import Account from './Account';

export abstract class Notification implements NotificationObject {
	protected static async Create(
		data: NewNotificationObject,
		id: number,
		target: NotificationTarget,
		account: Account,
		schema: Schema
	): Promise<RawNotificationObject & Required<NoSQLDocument>> {
		const notificationCollection = schema.getCollection<RawNotificationObject>('Notifications');

		const rawNotification: RawNotificationObject = {
			...data,
			id,
			target,
			accountID: account.id,
			archived: false,
			emailSent: false,
			created: Date.now(),
			read: false
		};

		const results = await notificationCollection.add(rawNotification).execute();

		return {
			...rawNotification,
			_id: results.getGeneratedIds()[0]
		};
	}

	public accountID: string;

	public id: number;

	public archived: boolean;

	public cause: NotificationCause;

	public created: number;

	public target: NotificationTarget;

	public text: string;

	public read: boolean;

	public emailSent: boolean;

	// tslint:disable-next-line:variable-name
	public _id: string;

	protected constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		private account: Account,
		private schema: Schema
	) {
		this.archived = data.archived;
		this.cause = data.cause;
		this.target = data.target;
		this.text = data.text;
		this.read = data.read;
		this.emailSent = data.emailSent;
		this._id = data._id;
		this.accountID = data.accountID;
		this.id = data.id;
	}

	public async save() {
		const notificationCollection = this.schema.getCollection<RawNotificationObject>('Notifications');

		await notificationCollection.replaceOne(this._id, this.toRaw());
	}

	public toRaw(): RawNotificationObject {
		return {
			accountID: this.account.id,
			archived: this.archived,
			cause: this.cause,
			created: this.created,
			emailSent: this.emailSent,
			id: this.id,
			read: this.read,
			target: this.target,
			text: this.text
		};
	}
}
