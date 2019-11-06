import { Schema } from '@mysql/xdevapi';
import {
	NoSQLDocument,
	NotificationAdminTarget,
	NotificationCause,
	NotificationCauseType,
	NotificationData,
	NotificationMemberCause,
	NotificationObject,
	NotificationSystemCause,
	NotificationTargetType
} from 'common-lib';
import { Account, MemberBase, Notification } from '../internals';

export default class AdminNotification extends Notification {
	public static async CreateNotification(
		text: string,
		from: NotificationSystemCause,
		extraData: NotificationData | null,
		account: Account,
		schema: Schema
	): Promise<AdminNotification>;
	public static async CreateNotification(
		text: string,
		from: NotificationMemberCause,
		extraData: NotificationData | null,
		account: Account,
		schema: Schema,
		fromMember: MemberBase
	): Promise<AdminNotification>;

	public static async CreateNotification(
		text: string,
		from: NotificationCause,
		extraData: NotificationData | null,
		account: Account,
		schema: Schema,
		fromMember?: MemberBase
	) {
		const results = await this.Create(
			{
				cause: from,
				text,
				extraData
			},
			{
				type: NotificationTargetType.ADMINS,
				accountID: account.id
			},
			account,
			schema
		);

		let fromMemberName = null;

		if (from.type === NotificationCauseType.MEMBER && fromMember === undefined) {
			throw new Error('Cannot get name of an undefined member');
		} else if (from.type === NotificationCauseType.MEMBER) {
			fromMemberName = fromMember!.getFullName();
		}

		return new AdminNotification(
			{
				...results,
				toMemberName: null,
				fromMemberName
			},
			account,
			schema
		);
	}

	public target: NotificationAdminTarget;

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);

		this.target = data.target as NotificationAdminTarget;
	}

	public canSee(member: MemberBase, account: Account) {
		return account.isAdmin(member.getReference());
	}
}
