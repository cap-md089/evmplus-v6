import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AllExtraMemberInformation,
	areMembersTheSame,
	AsyncIter,
	asyncIterConcat,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	countAsync,
	EitherObj,
	errorGenerator,
	get,
	isPartOfTeam,
	isRioux,
	Member,
	MemberReference,
	RawTeamObject,
	ServerError,
	StoredAccountMembership,
	toReference,
	User,
} from 'common-lib';
import { AccountGetter, getAccount } from '../Account';
import { findAndBind, generateResults, modifyAndBind } from '../MySQLUtil';
import { getMemberNotifications } from '../notifications/MemberNotification';
import { getTasksForMember } from '../Task';
import { CAP } from './members';

export * from './members';

export const saveExtraMemberInformation = (schema: Schema) => (account: AccountObject) => (
	info: AllExtraMemberInformation
) =>
	asyncRight(
		schema.getCollection<AllExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not save extra member information')
	)
		.map(collection =>
			modifyAndBind(collection, {
				accountID: account.id,
				member: info.member,
			})
		)
		.map(modifier => modifier.patch(info).execute());

export const getMemberTeams = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
) =>
	asyncRight(schema.getCollection<RawTeamObject>('Teams'), errorGenerator('Could not get teams'))
		.map(collection =>
			findAndBind(collection, {
				accountID: account.id,
			})
		)
		.map(generateResults)
		.map(asyncIterFilter(isPartOfTeam(member) as (v: RawTeamObject) => v is RawTeamObject));

export const getUnfinishedTaskCountForMember = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
) =>
	getTasksForMember(schema)(account)(member)
		.map(
			asyncIterFilter(
				task =>
					task.results.filter(v => areMembersTheSame(member)(v.tasked) && !v.done)
						.length > 0
			)
		)
		.map(countAsync);

export const getNotificationCount = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
) => getMemberNotifications(schema)(account)(member).map(countAsync);

export const getUnreadNotificationCount = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
) =>
	getMemberNotifications(schema)(account)(member)
		.map(asyncIterFilter(notification => !notification.read))
		.map(countAsync);

export const isRequesterRioux = <T extends { member: User }>(req: T) => isRioux(req.member);

export const getHomeAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema
) => (member: Member) => CAP.getHomeAccountsForMember(accountGetter)(schema)(member);

export const getExtraAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema
) => (member: MemberReference): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterMap((accountGetter.byId ?? getAccount)(schema))(
		asyncIterMap(get<StoredAccountMembership, 'accountID'>('accountID'))(
			generateResults(
				findAndBind(
					schema.getCollection<StoredAccountMembership>('ExtraAccountMembership'),
					{
						member: toReference(member),
					}
				)
			)
		)
	);

export const getAllAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema
) => (member: Member): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterConcat<EitherObj<ServerError, AccountObject>>(
		getHomeAccountsForMember(accountGetter)(schema)(member)
	)(() => getExtraAccountsForMember(accountGetter)(schema)(toReference(member)));
