import {
	NotificationCause,
	NotificationObject,
	NotificationTarget,
	RawNotificationObject
} from 'common-lib';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './Members';

export default class Notification extends APIInterface<RawNotificationObject>
	implements NotificationObject {
	public static async Get(id: number, account: Account, member: MemberBase) {
		const response = await account.fetch(`/api/notifications/${id}`, {}, member);

		const json = await response.json();

		return new Notification(json, account);
	}

	public static async GetList(account: Account, member: MemberBase) {
		const response = await account.fetch(`/api/notifications`, {}, member);

		const json = await response.json();

		return new Notification(json, account);
	}

	public static async GetGlobal(account: Account): Promise<Notification | null> {
		let response;

		try {
			response = await account.fetch(`/api/notifications/global`, {});
		} catch(e) {
			// Will throw 404 if there is no global notification
			return null;
		}

		if (response.status === 404) {
			return null;
		}

		const json = await response.json();

		return new Notification(json, account);
	}

	public static async GetListForAdmin(
		account: Account,
		member: MemberBase
	): Promise<Notification[]> {
		const response = await account.fetch(`/api/notifications/admin`, {}, member);

		const json = (await response.json()) as NotificationObject[];

		return json.map(notif => new Notification(notif, account));
	}

	public static async GetListForMember(
		account: Account,
		member: MemberBase
	): Promise<Notification[]> {
		const response = await account.fetch(`/api/notifications/member`, {}, member);

		const json = (await response.json()) as NotificationObject[];

		return json.map(notif => new Notification(notif, account));
	}

	public id: number;

	public text: string;

	public cause: NotificationCause;

	public target: NotificationTarget;

	public archived: boolean;

	public read: boolean;

	public emailSent: boolean;

	public created: number;

	public fromMemberName: string | null;

	public toMemberName: string | null;

	public constructor(data: NotificationObject, private account: Account) {
		super(account.id);

		this.id = data.id;
		this.text = data.text;
		this.cause = data.cause;
		this.target = data.target;
		this.archived = data.archived;
		this.read = data.read;
		this.emailSent = data.emailSent;
		this.created = data.created;
		this.fromMemberName = data.fromMemberName;
		this.toMemberName = data.toMemberName;
	}

	public toRaw(): NotificationObject {
		return {
			id: this.id,
			text: this.text,
			cause: this.cause,
			target: this.target,
			archived: this.archived,
			read: this.read,
			accountID: this.account.id,
			created: this.created,
			emailSent: this.emailSent,
			fromMemberName: this.fromMemberName,
			toMemberName: this.toMemberName
		};
	}
}
