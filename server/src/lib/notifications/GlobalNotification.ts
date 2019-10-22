import { Schema } from '@mysql/xdevapi';
import {
	NoSQLDocument,
	NotificationCause,
	NotificationEveryoneTarget,
	NotificationMemberCause,
	NotificationObject,
	NotificationSystemCause,
} from 'common-lib';
import { NotificationCauseType, NotificationTargetType } from 'common-lib/index';
import {
	Account,
	findAndBind,
	generateResults,
	MemberBase,
	MemberNotification,
	Notification
} from '../internals';

export default class GlobalNotification extends Notification {
	public static async AccountHasGlobalNotificationActive(
		account: Account,
		schema: Schema
	): Promise<boolean> {
		const notificationCollection = schema.getCollection<NotificationObject>('Notifications');

		const generator = generateResults(
			findAndBind(notificationCollection, {
				accountID: account.id
			})
		);

		for await (const result of generator) {
			if (
				result.target.type === NotificationTargetType.EVERYONE &&
				result.target.expires > Date.now() &&
				!result.read
			) {
				return true;
			}
		}

		return false;
	}

	public static async GetCurrent(account: Account, schema: Schema): Promise<GlobalNotification> {
		const notificationCollection = schema.getCollection<
			NotificationObject & Required<NoSQLDocument>
		>('Notifications');

		const generator = generateResults(
			findAndBind(notificationCollection, {
				accountID: account.id
			})
		);

		for await (const result of generator) {
			if (
				result.target.type === NotificationTargetType.EVERYONE &&
				result.target.expires > Date.now() &&
				!result.read
			) {
				return new GlobalNotification(result, account, schema);
			}
		}

		throw new Error('There is not curently an active notification');
	}

	public static async CreateNotification(
		text: string,
		expires: number,
		from: NotificationSystemCause,
		account: Account,
		schema: Schema
	): Promise<GlobalNotification>;
	public static async CreateNotification(
		text: string,
		expires: number,
		from: NotificationMemberCause,
		account: Account,
		schema: Schema,
		fromMember: MemberBase
	): Promise<GlobalNotification>;

	public static async CreateNotification(
		text: string,
		expires: number,
		from: NotificationCause,
		account: Account,
		schema: Schema,
		fromMember?: MemberBase
	) {
		if (await GlobalNotification.AccountHasGlobalNotificationActive(account, schema)) {
			throw new Error('Cannot create a global notification with one active');
		}

		const results = await this.Create(
			{
				cause: from,
				text,
				extraData: null
			},
			{
				type: NotificationTargetType.EVERYONE,
				accountID: account.id,
				expires
			},
			account,
			schema
		);

		/**
		 * This creates notifications for each member so that they can mark it as read
		 *
		 * This will not prevent it from showing up on the client as a banner
		 */
		for await (const member of account.getMembers()) {
			if (from.type === NotificationCauseType.SYSTEM) {
				await MemberNotification.CreateNotification(
					text,
					member,
					{ type: NotificationCauseType.SYSTEM },
					null,
					account,
					schema
				);
			} else {
				// `fromMember` is not undefined, as required by the overloads above
				await MemberNotification.CreateNotification(
					text,
					member,
					{ type: NotificationCauseType.MEMBER, from: fromMember!.getReference() },
					null,
					account,
					schema,
					fromMember!
				);
			}
		}

		return new GlobalNotification(
			{
				...results,
				toMemberName: null,
				fromMemberName:
				// `fromMember` is not undefined, as required by the overloads above
					from.type === NotificationCauseType.MEMBER ? fromMember!.getFullName() : null
			},
			account,
			schema
		);
	}

	public target: NotificationEveryoneTarget;

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);

		this.target = data.target as NotificationEveryoneTarget;
	}

	public canSee(member: MemberBase, account: Account) {
		return true;
	}
}
