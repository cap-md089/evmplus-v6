import { Schema } from '@mysql/xdevapi';
import {
	NoSQLDocument,
	NotificationAdminTarget,
	NotificationCause,
	NotificationMemberCause,
	NotificationObject,
	NotificationSystemCause
} from 'common-lib';
import { NotificationCauseType, NotificationTargetType } from 'common-lib/index';
import Account from '../Account';
import MemberBase from '../Members';
import { Notification } from '../Notification';

export default class AdminNotification extends Notification {
	public static async CreateNotification(
		text: string,
		from: NotificationSystemCause,
		account: Account,
		schema: Schema
	): Promise<AdminNotification>;
	public static async CreateNotification(
		text: string,
		from: NotificationMemberCause,
		account: Account,
		schema: Schema,
		fromMember: MemberBase
	): Promise<AdminNotification>;

	public static async CreateNotification(
		text: string,
		from: NotificationCause,
		account: Account,
		schema: Schema,
		fromMember?: MemberBase
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

		return new AdminNotification(
			{
				...results,
				toMemberName: null,
				fromMemberName:
					from.type === NotificationCauseType.MEMBER ? fromMember.getFullName() : null
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
	}

	public canSee(member: MemberBase, account: Account) {
		return account.isAdmin(member.getReference());
	}
}
