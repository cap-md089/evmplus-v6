/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { Schema } from '@mysql/xdevapi';
import {
	AccountLinkTarget,
	AccountObject,
	AllExtraMemberInformation,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterConcat,
	asyncIterFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	countAsync,
	EitherObj,
	errorGenerator,
	get,
	isPartOfTeam,
	isRioux,
	Member,
	MemberForReference,
	MemberPermissions,
	MemberReference,
	Permissions,
	RawTeamObject,
	ServerError,
	StoredAccountMembership,
	StoredMemberPermissions,
	toReference,
	User,
} from 'common-lib';
import { AccountGetter, getAccount } from './Account';
import { CAP } from './member/members';
import { getCAPMemberName, resolveCAPReference } from './member/members/cap';
import { findAndBind, generateResults, modifyAndBind } from './MySQLUtil';
import { getMemberNotifications } from './notifications';
import { getRegistryById } from './Registry';
import { getTasksForMember } from './Task';

export * from './member/members';

export const resolveReference = (schema: Schema) => (account: AccountObject) => <
	T extends MemberReference = MemberReference
>(
	ref: T,
): AsyncEither<ServerError, MemberForReference<T>> =>
	ref.type === 'CAPNHQMember' || ref.type === 'CAPProspectiveMember'
		? resolveCAPReference(schema)(account)<T>(ref)
		: asyncLeft({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });

export const getMemberName = (schema: Schema) => (account: AccountObject) => (
	ref: MemberReference,
): AsyncEither<ServerError, string> =>
	ref.type === 'CAPProspectiveMember' || ref.type === 'CAPNHQMember'
		? getCAPMemberName(schema)(account)(ref)
		: asyncLeft({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });

export const saveExtraMemberInformation = (schema: Schema) => (account: AccountObject) => (
	info: AllExtraMemberInformation,
) =>
	asyncRight(
		schema.getCollection<AllExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not save extra member information'),
	)
		.map(collection =>
			modifyAndBind(collection, {
				accountID: account.id,
				member: info.member,
			}),
		)
		.map(modifier => modifier.patch(info).execute());

export const getMemberTeams = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
) =>
	asyncRight(schema.getCollection<RawTeamObject>('Teams'), errorGenerator('Could not get teams'))
		.map(collection =>
			findAndBind(collection, {
				accountID: account.id,
			}),
		)
		.map(generateResults)
		.map(asyncIterFilter(isPartOfTeam(member) as (v: RawTeamObject) => v is RawTeamObject));

export const getUnfinishedTaskCountForMember = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
) =>
	getTasksForMember(schema)(account)(member)
		.map(
			asyncIterFilter(
				task =>
					task.results.filter(v => areMembersTheSame(member)(v.tasked) && !v.done)
						.length > 0,
			),
		)
		.map(countAsync);

export const getNotificationCount = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
) => getMemberNotifications(schema)(account)(member).map(countAsync);

export const getUnreadNotificationCount = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
) =>
	getMemberNotifications(schema)(account)(member)
		.map(asyncIterFilter(notification => !notification.read))
		.map(countAsync);

export const isRequesterRioux = <T extends { member: User }>(req: T) => isRioux(req.member);

export const getHomeAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: Member) => CAP.getHomeAccountsForMember(accountGetter)(schema)(member);

export const getExtraAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: MemberReference): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterMap((accountGetter.byId ?? getAccount)(schema))(
		asyncIterMap(get<StoredAccountMembership, 'accountID'>('accountID'))(
			generateResults(
				findAndBind(
					schema.getCollection<StoredAccountMembership>('ExtraAccountMembership'),
					{
						member: toReference(member),
					},
				),
			),
		),
	);

export const getAllAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: Member): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterConcat<EitherObj<ServerError, AccountObject>>(
		getHomeAccountsForMember(accountGetter)(schema)(member),
	)(() => getExtraAccountsForMember(accountGetter)(schema)(toReference(member)));

export const getAdminAccountIDsForMember = (schema: Schema) => (
	member: MemberReference,
): AsyncIter<EitherObj<ServerError, AccountLinkTarget>> =>
	asyncIterMap<{ accountID: string }, EitherObj<ServerError, AccountLinkTarget>>(record =>
		getRegistryById(schema)(record.accountID).map(registry => ({
			name: registry.Website.Name,
			id: record.accountID,
		})),
	)(
		asyncIterFilter<{ accountID: string }>(record => record.accountID !== 'www')(
			generateResults<{ accountID: string }>(
				findAndBind(schema.getCollection<StoredMemberPermissions>('UserPermissions'), {
					member: toReference(member),
					permissions: {
						ManageEvent: Permissions.ManageEvent.FULL,
					} as MemberPermissions,
				}).fields('accountID'),
			),
		),
	);
