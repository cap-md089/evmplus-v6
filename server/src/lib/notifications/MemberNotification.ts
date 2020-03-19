import { Schema } from '@mysql/xdevapi';
import {
	getMemberEmail,
	Maybe,
	MemberReference,
	none,
	NoSQLDocument,
	NotificationCause,
	NotificationCauseType,
	NotificationData,
	NotificationMemberCause,
	NotificationMemberTarget,
	NotificationObject,
	NotificationSystemCause,
	NotificationTargetType
} from 'common-lib';
import { Account, MemberBase, Notification, resolveReference, sendEmail } from '../internals';
import Registry from '../Registry';

export default class MemberNotification extends Notification {
	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationSystemCause,
		extraData: NotificationData,
		account: Account,
		schema: Schema,
		registry: Registry
	): Promise<MemberNotification>;
	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationMemberCause,
		extraData: NotificationData,
		account: Account,
		schema: Schema,
		registry: Registry,
		fromMember: MemberBase
	): Promise<MemberNotification>;

	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationCause,
		extraData: NotificationData,
		account: Account,
		schema: Schema,
		registry: Registry,
		fromMember?: MemberBase
	) {
		const results = await this.Create(
			{
				cause: from,
				text,
				extraData
			},
			{
				type: NotificationTargetType.MEMBER,
				to: to instanceof MemberBase ? to.getReference() : to
			},
			account,
			schema
		);

		let toMemberName: string;
		let toMemberEmail: Maybe<string> = none();

		if (to instanceof MemberBase) {
			toMemberName = to.getFullName();

			toMemberEmail = getMemberEmail(to.contact);
		} else {
			const toMember = await resolveReference(to, account, schema, true);

			toMemberName = toMember.getFullName();
			toMemberEmail = getMemberEmail(toMember.contact);
		}

		await toMemberEmail
			.map(email =>
				sendEmail(false)(registry)('New notification')(email)(
					`<p>You have a new notification!</p><p>View your notifications <a href="https://${account.id}.capunit.com/admin/notifications">here</a>.`
				)(
					`You have a new notification.\n\nSign into ${account.id}.capunit.com now to view it`
				)
			)
			.orNull();

		return new MemberNotification(
			{
				...results,
				fromMemberName:
					// fromMember is defined, as required by overloads above
					from.type === NotificationCauseType.MEMBER ? fromMember!.getFullName() : null,
				toMemberName
			},
			account,
			schema
		);
	}

	public target: NotificationMemberTarget;

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);

		this.target = data.target as NotificationMemberTarget;
	}

	public canSee(member: MemberBase, account: Account) {
		return member.matchesReference(this.target.to);
	}
}
