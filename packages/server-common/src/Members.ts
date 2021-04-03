/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { Schema } from '@mysql/xdevapi';
import {
	AccountLinkTarget,
	AccountObject,
	AccountType,
	AllExtraMemberInformation,
	always,
	areMembersTheSame,
	asyncEither,
	AsyncEither,
	AsyncIter,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncIterReduce,
	asyncLeft,
	asyncRight,
	BasicMySQLRequest,
	countAsync,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	get,
	getORGIDsFromCAPAccount,
	isPartOfTeam,
	isRioux,
	Maybe,
	Member,
	MemberForReference,
	MemberPermissions,
	MemberReference,
	memoize,
	parseStringMemberReference,
	Permissions,
	pipe,
	asyncIterConcat2,
	RawCAPEventAccountObject,
	RawTeamObject,
	ServerError,
	SignInLogData,
	StoredAccountMembership,
	StoredMemberPermissions,
	stringifyMemberReference,
	toReference,
	User,
} from 'common-lib';
import { AccountBackend, AccountGetter, getAccount } from './Account';
import { RawAttendanceDBRecord } from './Attendance';
import { Backends, notImplementedError } from './backends';
import { CAP } from './member/members';
import { getCAPMemberName, resolveCAPReference } from './member/members/cap';
import {
	collectResults,
	findAndBind,
	findAndBindC,
	generateResults,
	modifyAndBind,
	RawMySQLBackend,
} from './MySQLUtil';
import { getMemberNotifications } from './notifications';
import { getRegistryById } from './Registry';
import { ServerEither } from './servertypes';
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

export const logSigninFunc = (now: () => number = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (ref: MemberReference) =>
	asyncRight(
		schema.getCollection<SignInLogData>('SignInLog'),
		errorGenerator('Could not save sign in log'),
	)
		.map(collection =>
			findAndBind(collection, {
				memberRef: toReference(ref),
				accountID: account.id,
			}),
		)
		.map(collectResults)
		.map(Maybe.fromArray)
		.tap(async maybeResult => {
			if (Maybe.isNone(maybeResult)) {
				const collection = schema.getCollection<SignInLogData>('SignInLog');
				await collection
					.add({
						accessCount: 0,
						accountID: account.id,
						lastAccessTime: 0,
						memberRef: toReference(ref),
					})
					.execute();
			}
		})
		.map(
			Maybe.orSome({
				accessCount: 0,
				accountID: account.id,
				lastAccessTime: 0,
				memberRef: toReference(ref),
			}),
		)
		.map(rec =>
			modifyAndBind(schema.getCollection<SignInLogData>('SignInLog'), {
				memberRef: rec.memberRef,
				accountID: account.id,
			})
				.patch({
					accessCount: rec.accessCount + 1,
					lastAccessTime: now(),
				})
				.execute(),
		)
		.map(destroy);

export const logSignin = logSigninFunc();

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

const updateExtraMemberInformation = (schema: Schema) => (info: AllExtraMemberInformation) =>
	asyncRight(
		schema.getCollection<AllExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not save extra member information'),
	)
		.map(collection =>
			modifyAndBind(collection, {
				accountID: info.accountID,
				member: info.member,
			}),
		)
		.map(modifier => modifier.patch(info).execute());

const addExtraMemberInformation = (schema: Schema) => (info: AllExtraMemberInformation) =>
	asyncRight(
		schema.getCollection<AllExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not save extra member information'),
	).map(collection => collection.add(info).execute());

export const saveExtraMemberInformation = (schema: Schema) => (info: AllExtraMemberInformation) =>
	asyncRight(
		schema.getCollection<AllExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not save extra member information'),
	)
		.map(collection =>
			findAndBind(collection, {
				accountID: info.accountID,
				member: info.member,
			}),
		)
		.map(collectResults)
		.flatMap(results =>
			results.length !== 0
				? updateExtraMemberInformation(schema)(info)
				: addExtraMemberInformation(schema)(info),
		);

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

export const accountHasMemberInAttendance = (schema: Schema) => (member: MemberReference) => (
	account: AccountObject,
) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not check attendance for member'),
	)
		.map(
			findAndBindC<RawAttendanceDBRecord>({
				memberID: toReference(member),
				accountID: account.id,
			}),
		)
		.map(generateResults)
		.map(asyncIterReduce(always(true))(false));

export const getEventAccountsForMember = (schema: Schema) => (member: MemberReference) =>
	pipe(
		generateResults,
		asyncIterFilter((account: RawCAPEventAccountObject) =>
			accountHasMemberInAttendance(schema)(member)(account).fullJoin().catch(always(false)),
		),
		asyncIterHandler<RawCAPEventAccountObject>(
			errorGenerator('Could not get account information'),
		),
	)(
		findAndBind(schema.getCollection<RawCAPEventAccountObject>('Accounts'), {
			type: AccountType.CAPEVENT,
		}),
	);

export const getExtraAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: MemberReference): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterConcat2(
		pipe(
			generateResults,
			asyncIterMap(get<StoredAccountMembership, 'accountID'>('accountID')),
			asyncIterMap((accountGetter.byId ?? getAccount)(schema)),
		)(
			findAndBind(schema.getCollection<StoredAccountMembership>('ExtraAccountMembership'), {
				member: toReference(member),
			}),
		),
		getEventAccountsForMember(schema)(member),
	);

export const getAllAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: Member): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterConcat2<EitherObj<ServerError, AccountObject>>(
		getHomeAccountsForMember(accountGetter)(schema)(member),
		getExtraAccountsForMember(accountGetter)(schema)(toReference(member)),
	);

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

const isPartOfAccountSlow = (accountGetter: Partial<AccountGetter>) => (schema: Schema) => (
	member: Member,
) => (account: AccountObject) =>
	asyncIterReduce<EitherObj<ServerError, AccountObject>, boolean>(
		(prev, curr) => prev && (Either.isLeft(curr) || account.id === curr.value.id),
	)(false)(getAllAccountsForMember(accountGetter)(schema)(member));

export const isMemberPartOfAccount = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema,
) => (member: Member) => (account: AccountObject) =>
	member.type === 'CAPProspectiveMember' &&
	account.type === AccountType.CAPSQUADRON &&
	account.id === member.id
		? asyncRight(true, errorGenerator('Could not verify account membership'))
		: member.type === 'CAPNHQMember'
		? Maybe.orSome(false)(
				Maybe.map<number[], boolean>(ids => ids.includes(member.orgid))(
					getORGIDsFromCAPAccount(account),
				),
		  )
			? asyncRight(true, errorGenerator('Could not verify account membership'))
			: asyncRight(
					isPartOfAccountSlow(accountGetter)(schema)(member)(account),
					errorGenerator('Could not verify account membership'),
			  )
		: asyncRight(false, errorGenerator('Could not verify account membership'));

export const getAllMemberAccounts = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member: Member) => null;

export const newIsPartOfAccountSlow = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member: Member) => (account: AccountObject) => null;

export const newIsMemberPartOfAccount = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member: Member) => (account: AccountObject) =>
	member.type === 'CAPProspectiveMember' &&
	account.type === AccountType.CAPSQUADRON &&
	account.id === member.id
		? asyncRight(true, errorGenerator('Could not verify account membership'))
		: member.type === 'CAPNHQMember'
		? Maybe.orSome(false)(
				Maybe.map<number[], boolean>(ids => ids.includes(member.orgid))(
					getORGIDsFromCAPAccount(account),
				),
		  )
			? asyncRight(true, errorGenerator('Could not verify account membership'))
			: newIsPartOfAccountSlow(backend)(member)(account)
		: asyncRight(false, errorGenerator('Could not verify account membership'));

export const areMembersInTheSameAccount = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member1: Member) => (member2: Member) => {};

export interface MemberBackend {
	getMember: (
		account: AccountObject,
	) => <T extends MemberReference = MemberReference>(
		ref: T,
	) => ServerEither<MemberForReference<T>>;
	accountHasMemberInAttendance: (
		member: MemberReference,
	) => (account: AccountObject) => ServerEither<boolean>;
	saveExtraMemberInformation: (info: AllExtraMemberInformation) => ServerEither<void>;
}

export const getMemberBackend = (req: BasicMySQLRequest): MemberBackend => ({
	getMember: memoize((account: AccountObject) => {
		const memoizedFunction = memoize(
			(ref: string): ServerEither<Member> =>
				asyncEither(
					parseStringMemberReference(ref),
					errorGenerator('Could not get member information'),
				).flatMap(resolveReference(req.mysqlx)(account)),
		);

		return <T extends MemberReference = MemberReference>(ref: T) =>
			memoizedFunction(stringifyMemberReference(ref)) as ServerEither<MemberForReference<T>>;
	}),
	accountHasMemberInAttendance: member => account =>
		accountHasMemberInAttendance(req.mysqlx)(member)(account),
	saveExtraMemberInformation: info => saveExtraMemberInformation(req.mysqlx)(info).map(destroy),
});

export const getEmptyMemberBackend = (): MemberBackend => ({
	getMember: () => () => notImplementedError('getMember'),
	accountHasMemberInAttendance: () => () => notImplementedError('accountHasMemberInAttendance'),
	saveExtraMemberInformation: () => notImplementedError('saveExtraMemberInformation'),
});
