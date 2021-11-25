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
	AsyncEither,
	asyncEitherIterFlatMap,
	AsyncIter,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncIterReduce,
	asyncLeft,
	asyncRight,
	countAsync,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	filterUnique,
	get,
	getORGIDsFromCAPAccount,
	isPartOfTeam,
	iterMap,
	iterToArray,
	Maybe,
	Member,
	MemberForReference,
	MemberPermissions,
	MemberReference,
	memoize,
	Permissions,
	pipe,
	RawCAPEventAccountObject,
	RawTeamObject,
	ServerError,
	SignInLogData,
	StoredAccountMembership,
	StoredMemberPermissions,
	stringifyMemberReference,
	TableDataType,
	toReference,
} from 'common-lib';
import { DateTime } from 'luxon';
import { AccountBackend, BasicAccountRequest } from './Account';
import { RawAttendanceDBRecord } from './Attendance';
import { Backends, notImplementedError, notImplementedException } from './backends';
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
import { getRegistryById, RegistryBackend } from './Registry';
import { ServerEither } from './servertypes';
import { getTasksForMember } from './Task';
import { TeamsBackend } from './Team';

export * from './member/members';

export const resolveReference = (schema: Schema) => (backend: Backends<[TeamsBackend]>) => (
	account: AccountObject,
) => <T extends MemberReference = MemberReference>(
	ref: T,
): AsyncEither<ServerError, MemberForReference<T>> =>
	ref.type === 'CAPNHQMember' || ref.type === 'CAPProspectiveMember'
		? resolveCAPReference(schema)(backend)(account)<T>(ref)
		: asyncLeft({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });

export const logSigninFunc = (now: () => number = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (ref: MemberReference): ServerEither<void> =>
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

export const saveExtraMemberInformation = (schema: Schema) => (
	info: AllExtraMemberInformation,
): ServerEither<AllExtraMemberInformation> =>
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
		)
		.map(always(info));

export const getMemberTeams = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
): ServerEither<AsyncIter<RawTeamObject>> =>
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
): ServerEither<number> =>
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
): ServerEither<number> => getMemberNotifications(schema)(account)(member).map(countAsync);

export const getUnreadNotificationCount = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
): ServerEither<number> =>
	getMemberNotifications(schema)(account)(member)
		.map(asyncIterFilter(notification => !notification.read))
		.map(countAsync);

export const accountHasMemberInAttendance = (schema: Schema) => (member: MemberReference) => (
	account: AccountObject,
): ServerEither<boolean> =>
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

export const getEventAccountsForMember = (schema: Schema) => (
	member: MemberReference,
): AsyncIter<EitherObj<ServerError, RawCAPEventAccountObject>> =>
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

export const getExtraAccountMembership = (backend: Backends<[RawMySQLBackend, AccountBackend]>) => (
	member: Member,
): ServerEither<AccountObject[]> =>
	asyncRight(
		backend.getCollection('ExtraAccountMembership'),
		errorGenerator('Could not get member accounts'),
	)
		.map(
			findAndBindC<TableDataType<'ExtraAccountMembership'>>({ member: toReference(member) }),
		)
		.map(collectResults)
		.map(iterMap(get('accountID')))
		.map(filterUnique)
		.map(iterToArray)
		.flatMap(accounts => AsyncEither.All(accounts.map(backend.getAccount)));

export const getHomeMemberAccounts = (
	backend: Backends<[AccountBackend, CAP.CAPMemberBackend]>,
) => (member: Member): ServerEither<AccountObject[]> => backend.getAccountsForMember(member);

export const getEventAccountMembership = (backend: Backends<[RawMySQLBackend, AccountBackend]>) => (
	member: Member,
): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	pipe(
		findAndBindC<AccountObject>({
			type: AccountType.CAPEVENT,
		}),
		generateResults,
		asyncIterFilter(account =>
			accountHasMemberInAttendance(backend.getSchema())(member)(account)
				.fullJoin()
				.catch(always(false)),
		),
		asyncIterHandler<RawCAPEventAccountObject>(
			errorGenerator('Could not get account information'),
		),
	)(backend.getCollection('Accounts'));

export const getBasicMemberAccounts = (
	backend: Backends<[AccountBackend, RawMySQLBackend, CAP.CAPMemberBackend]>,
) => (member: Member): ServerEither<AccountObject[]> =>
	getHomeMemberAccounts(backend)(member)
		.flatMap(homeAccounts =>
			getExtraAccountMembership(backend)(member).map(extraAccounts => [
				...extraAccounts,
				...homeAccounts,
			]),
		)
		.map(filterUnique)
		.map(iterToArray);

export const isPartOfAccountSlow = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member: Member) => (account: AccountObject): ServerEither<boolean> =>
	asyncRight(
		backend.getCollection('ExtraAccountMembership'),
		errorGenerator('Could not verify account membership'),
	)
		.map(
			findAndBindC<StoredAccountMembership>({
				member: toReference(member),
				accountID: account.id,
			}),
		)
		.map(collectResults)
		.map(results => results.length === 1);

export const isMemberPartOfAccount = (
	backend: Backends<[AccountBackend, MemberBackend, RawMySQLBackend]>,
) => (member: Member) => (account: AccountObject): ServerEither<boolean> =>
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
			: isPartOfAccountSlow(backend)(member)(account)
		: asyncRight(false, errorGenerator('Could not verify account membership'));

export const areMembersInTheSameAccount = (
	backend: Backends<[AccountBackend, MemberBackend, TeamsBackend, CAP.CAPMemberBackend]>,
) => (member1: Member) => (member2: Member): ServerEither<boolean> =>
	backend
		.getAccountsForMember(member1)
		.map(asyncIterMap(Either.right))
		.map(asyncEitherIterFlatMap(backend.memberBelongsToAccount(member2)))
		.map(
			asyncIterReduce(
				(prev: boolean, curr: EitherObj<ServerError, boolean>) =>
					prev || (Either.isRight(curr) ? curr.value : false),
			)(false),
		);

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
	getBasicMemberAccounts: (member: Member) => ServerEither<AccountObject[]>;
	getEventAccountMembership: (member: Member) => AsyncIter<EitherObj<ServerError, AccountObject>>;
	getAdminAccountIDs: (
		member: MemberReference,
	) => AsyncIter<EitherObj<ServerError, AccountLinkTarget>>;
	logSignin: (account: AccountObject) => (member: MemberReference) => ServerEither<void>;
	getUnfinishedTaskCountForMember: (
		account: AccountObject,
	) => (member: MemberReference) => ServerEither<number>;
	getUnreadNotificationCountForMember: (
		account: AccountObject,
	) => (member: MemberReference) => ServerEither<number>;
	getMemberName: (account: AccountObject) => (ref: MemberReference) => ServerEither<string>;
	memberBelongsToAccount: (member: Member) => (account: AccountObject) => ServerEither<boolean>;
	accountHasMember: (account: AccountObject) => (member: Member) => ServerEither<boolean>;
	getBirthday: (member: Member) => ServerEither<DateTime>;
	areMembersInTheSameAccount: (member1: Member) => (member2: Member) => ServerEither<boolean>;
}

export const getMemberBackend = (
	req: BasicAccountRequest,
	prevBackend: Backends<[CAP.CAPMemberBackend, TeamsBackend]>,
): MemberBackend => {
	const backend: MemberBackend = {
		getMember: memoize(
			account =>
				memoize(
					resolveReference(req.mysqlx)(prevBackend)(account),
					stringifyMemberReference,
				) as <T extends MemberReference = MemberReference>(
					ref: T,
				) => ServerEither<MemberForReference<T>>,
			get('id'),
		),
		accountHasMemberInAttendance: member => account =>
			accountHasMemberInAttendance(req.mysqlx)(member)(account),
		saveExtraMemberInformation: info =>
			saveExtraMemberInformation(req.mysqlx)(info).map(destroy),
		getBasicMemberAccounts: memoize(
			getBasicMemberAccounts({ ...req.backend, ...prevBackend }),
			stringifyMemberReference,
		),
		getEventAccountMembership: memoize(
			(member: Member) => getEventAccountMembership(req.backend)(member),
			stringifyMemberReference,
		),
		getAdminAccountIDs: memoize(
			getAdminAccountIDsForMember(req.mysqlx),
			stringifyMemberReference,
		),
		logSignin: account => member => logSignin(req.mysqlx)(account)(toReference(member)),
		getUnfinishedTaskCountForMember: memoize(
			account =>
				memoize(
					getUnfinishedTaskCountForMember(req.mysqlx)(account),
					stringifyMemberReference,
				),
			get('id'),
		),
		getUnreadNotificationCountForMember: memoize(
			account =>
				memoize(getUnreadNotificationCount(req.mysqlx)(account), stringifyMemberReference),
			get('id'),
		),
		getMemberName: memoize(
			account => memoize(getMemberName(req.mysqlx)(account), stringifyMemberReference),
			get('id'),
		),
		memberBelongsToAccount: member => account =>
			isMemberPartOfAccount({ ...req.backend, ...backend })(member)(account),
		accountHasMember: account => member =>
			isMemberPartOfAccount({ ...req.backend, ...backend })(member)(account),
		getBirthday: prevBackend.getBirthday,
		areMembersInTheSameAccount: memoize(
			(mem1: Member) =>
				memoize(
					areMembersInTheSameAccount({ ...prevBackend, ...backend, ...req.backend })(
						mem1,
					),
					stringifyMemberReference,
				),
			stringifyMemberReference,
		),
	};

	return backend;
};

export const getEmptyMemberBackend = (): MemberBackend => ({
	getMember: () => () => notImplementedError('getMember'),
	accountHasMemberInAttendance: () => () => notImplementedError('accountHasMemberInAttendance'),
	saveExtraMemberInformation: () => notImplementedError('saveExtraMemberInformation'),
	getBasicMemberAccounts: () => notImplementedError('getBasicMemberAccounts'),
	getEventAccountMembership: () => notImplementedException('getEventAccountMembership'),
	getAdminAccountIDs: () => [],
	logSignin: () => () => notImplementedError('logSignin'),
	getUnfinishedTaskCountForMember: () => () =>
		notImplementedError('getUnfinishedTaskCountForMember'),
	getUnreadNotificationCountForMember: () => () =>
		notImplementedError('getUnreadNotificationCountForMember'),
	getMemberName: () => () => notImplementedError('getMemberName'),
	memberBelongsToAccount: () => () => notImplementedError('memberBelongsToAccount'),
	accountHasMember: () => () => notImplementedError('accountHasMember'),
	getBirthday: () => notImplementedError('getBirthday'),
	areMembersInTheSameAccount: () => () => notImplementedError('areMembersInTheSameAccount'),
});

export const getRequestFreeMemberBackend = (
	db: Schema,
	prevBackend: Backends<
		[RawMySQLBackend, RegistryBackend, AccountBackend, CAP.CAPMemberBackend, TeamsBackend]
	>,
): MemberBackend => {
	const backend: MemberBackend = {
		getMember: memoize(
			account =>
				memoize(resolveReference(db)(prevBackend)(account), stringifyMemberReference) as <
					T extends MemberReference = MemberReference
				>(
					ref: T,
				) => ServerEither<MemberForReference<T>>,
			get('id'),
		),
		accountHasMemberInAttendance: accountHasMemberInAttendance(db),
		accountHasMember: account => member =>
			isMemberPartOfAccount({ ...prevBackend, ...backend })(member)(account),
		getAdminAccountIDs: getAdminAccountIDsForMember(db),
		getBasicMemberAccounts: memoize(
			(member: Member) => getBasicMemberAccounts({ ...prevBackend, ...backend })(member),
			stringifyMemberReference,
		),
		getEventAccountMembership: getEventAccountMembership(prevBackend),
		getMemberName: getMemberName(db),
		getUnfinishedTaskCountForMember: getUnfinishedTaskCountForMember(db),
		getUnreadNotificationCountForMember: getUnreadNotificationCount(db),
		logSignin: logSignin(db),
		memberBelongsToAccount: member =>
			isMemberPartOfAccount({ ...prevBackend, ...backend })(member),
		saveExtraMemberInformation: info => saveExtraMemberInformation(db)(info).map(destroy),
		getBirthday: prevBackend.getBirthday,
		areMembersInTheSameAccount: memoize(
			(mem1: Member) =>
				memoize(
					areMembersInTheSameAccount({ ...prevBackend, ...backend })(mem1),
					stringifyMemberReference,
				),
			stringifyMemberReference,
		),
	};

	return backend;
};
