import { Schema } from '@mysql/xdevapi';
import {
	NewNotificationObject,
	NoSQLDocument,
	NotificationAdminTarget,
	NotificationCause,
	NotificationEveryoneTarget,
	NotificationMemberTarget,
	NotificationObject,
	NotificationTarget,
	RawNotificationObject
} from 'common-lib';
import { NotificationTargetType } from 'common-lib/index';
import Account from './Account';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';

export abstract class Notification implements NotificationObject {
	public static async Get(
		id: number,
		account: Account,
		schema: Schema
	): Promise<AdminNotification | MemberNotification | GlobalNotification> {
		const notificationCollection = schema.getCollection<
			RawNotificationObject & Required<NoSQLDocument>
		>('Notifications');

		const results = await collectResults(
			findAndBind(notificationCollection, {
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get notification');
		}

		switch (results[0].target.type) {
			case NotificationTargetType.ADMINS :
				return new AdminNotification(results[0], account, schema);

			case NotificationTargetType.MEMBER :
				return new MemberNotification(results[0], account, schema);

			case NotificationTargetType.EVERYONE :
				return new GlobalNotification(results[0], account, schema);
		}
	}

	public static async GetOfTarget(
		id: number,
		target: NotificationAdminTarget,
		account: Account,
		schema: Schema
	): Promise<AdminNotification>;
	public static async GetOfTarget(
		id: number,
		target: NotificationMemberTarget,
		account: Account,
		schema: Schema
	): Promise<MemberNotification>;
	public static async GetOfTarget(
		id: number,
		target: NotificationEveryoneTarget,
		account: Account,
		schema: Schema
	): Promise<GlobalNotification>;

	public static async GetOfTarget(
		id: number,
		target: NotificationTarget,
		account: Account,
		schema: Schema
	): Promise<AdminNotification | MemberNotification | GlobalNotification> {
		const notificationCollection = schema.getCollection<
			RawNotificationObject & Required<NoSQLDocument>
		>('Notifications');

		const results = await collectResults(
			findAndBind(notificationCollection, {
				target,
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get notification');
		}

		switch (results[0].target.type) {
			case NotificationTargetType.ADMINS :
				return new AdminNotification(results[0], account, schema);

			case NotificationTargetType.MEMBER :
				return new MemberNotification(results[0], account, schema);

			case NotificationTargetType.EVERYONE :
				return new GlobalNotification(results[0], account, schema);
		}
	}

	public static async GetFor(
		target: NotificationAdminTarget,
		account: Account,
		schema: Schema
	): Promise<AdminNotification[]>;
	public static async GetFor(
		target: NotificationMemberTarget,
		account: Account,
		schema: Schema
	): Promise<MemberNotification[]>;

	public static async GetFor(
		target: NotificationTarget,
		account: Account,
		schema: Schema
	): Promise<Array<AdminNotification | MemberNotification>> {
		const notificationCollection = schema.getCollection<
			RawNotificationObject & Required<NoSQLDocument>
		>('Notifications');

		const results = await collectResults(
			findAndBind(notificationCollection, {
				target,
				accountID: account.id
			})
		);

		const returnValue: Array<AdminNotification | MemberNotification> = [];

		for (const i of results) {
			switch (i.target.type) {
				case NotificationTargetType.ADMINS :
					returnValue.push(new AdminNotification(i, account, schema));
				break;

				case NotificationTargetType.MEMBER :
					returnValue.push(new MemberNotification(i, account, schema));
				break;

				case NotificationTargetType.EVERYONE :
					if (i.target.expires > Date.now()) {
						returnValue.push(new GlobalNotification(i, account, schema));
					}
				break;
			}
		}

		return returnValue;
	}

	protected static async Create(
		data: NewNotificationObject,
		target: NotificationTarget,
		account: Account,
		schema: Schema
	): Promise<RawNotificationObject & Required<NoSQLDocument>> {
		const notificationCollection = schema.getCollection<RawNotificationObject>('Notifications');

		let id: number = 0;

		const notifGenerator = generateResults(
			findAndBind(notificationCollection, {
				accountID: account.id
			})
		);

		for await (const notif of notifGenerator) {
			id = Math.max(notif.id, id);
		}

		id++;

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

	public get read(): boolean {
		return this.wasRead;
	};

	public emailSent: boolean;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private wasRead: boolean;

	protected constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		private account: Account,
		private schema: Schema
	) {
		this.archived = data.archived;
		this.cause = data.cause;
		this.target = data.target;
		this.text = data.text;
		this.wasRead = data.read;
		this.emailSent = data.emailSent;
		this._id = data._id;
		this.accountID = data.accountID;
		this.id = data.id;
	}

	public async save() {
		const notificationCollection = this.schema.getCollection<RawNotificationObject>(
			'Notifications'
		);

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

	public markAsRead() {
		this.wasRead = true;
	}

	public async delete() {
		const notificationCollection = this.schema.getCollection<RawNotificationObject>(
			'Notifications'
		);

		await notificationCollection.removeOne(this._id);
	}
}

import AdminNotification from './notifications/AdminNotification';
import GlobalNotification from './notifications/GlobalNotification';
import MemberNotification from './notifications/MemberNotification';