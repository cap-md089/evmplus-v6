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

import { Schema, Session } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	always,
	applyCustomAttendanceFields,
	AsyncEither,
	asyncEitherIterMap,
	AsyncIter,
	asyncIterConcat,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncRight,
	AttendanceStatus,
	BasicMySQLRequest,
	CAPAccountObject,
	CAPProspectiveMemberObject,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	EventObject,
	FileObject,
	FullPointOfContact,
	get,
	getDefaultAdminPermissions,
	identity,
	isRioux,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	MemberType,
	memoize,
	NewEventObject,
	NHQ,
	ofLength,
	onlyRights,
	ParamType,
	RawCAPEventAccountObject,
	RawCAPGroupAccountObject,
	RawCAPRegionAccountObject,
	RawCAPSquadronAccountObject,
	RawCAPWingAccountObject,
	RawEventObject,
	RawRegularEventObject,
	RawTeamObject,
	ServerConfiguration,
	ServerError,
	statefulFunction,
	StoredAccountMembership,
	StoredProspectiveMemberObject,
	stringifyMemberReference,
	stripProp,
	toReference,
	User,
	yieldObjAsync,
} from 'common-lib';
import { copyFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { addMemberToAttendanceFunc, createEventFunc, linkEvent } from './Event';
import { createGoogleCalendarForEvent } from './GoogleUtils';
import { setPermissionsForMemberInAccount } from './member/pam';
import { CAP, resolveReference } from './Members';
import {
	addToCollection,
	collectResults,
	findAndBind,
	findAndBindC,
	generateResults,
	safeBind,
} from './MySQLUtil';
import { getRegistry, getRegistryById, saveRegistry } from './Registry';
import { ServerEither } from './servertypes';
import { getStaffTeam } from './Team';

export interface BasicAccountRequest<P extends ParamType = {}, B = any>
	extends BasicMySQLRequest<P, B> {
	account: AccountObject;
}

export const accountRequestTransformer = <T extends BasicMySQLRequest>(
	req: T,
): AsyncEither<ServerError, T & BasicAccountRequest> =>
	asyncRight(req.hostname.split('.'), errorGenerator('Could not get account'))
		.flatMap<string>(parts => {
			while (parts[0] === 'www') {
				parts.shift();
			}

			if (parts.length === 1 && process.env.NODE_ENV === 'development') {
				// localhost
				return Either.right(process.env.DEFAULT_ACCOUNT ?? 'md089');
			} else if (parts.length === 2) {
				// evmplus.org
				return Either.right('www');
			} else if (parts.length === 3) {
				// md089.evmplus.org
				return Either.right(parts[0]);
			} else if (parts.length === 4 && process.env.NODE_ENV === 'development') {
				// 192.168.1.128
				return Either.right(process.env.DEFAULT_ACCOUNT ?? 'md089');
			} else {
				// IP/localhost in production, otherwise invalid hostname
				return Either.left({
					type: 'OTHER',
					code: 404,
					message: 'Could not get account ID from URL',
				});
			}
		})
		.flatMap(getAccount(req.mysqlx))
		.map(account => ({ ...req, headers: req.headers, account }));

export const createCAPEventAccountFunc = (now = Date.now) => (config: ServerConfiguration) => (
	session: Session,
) => (schema: Schema) => (parentAccount: RawCAPWingAccountObject) => (author: User) => (
	accountID: string,
) => (accountName: string) => (newEvent: NewEventObject): ServerEither<RawCAPEventAccountObject> =>
	asyncRight(
		(async () => {
			const dutyPositions = author.dutyPositions
				.filter(
					duty => duty.type === 'CAPUnit' || parentAccount.orgIDs.includes(duty.orgid),
				)
				.map(({ duty }) => duty);

			if (
				!dutyPositions.includes('Information Technologies Officer') &&
				!dutyPositions.includes('Commander') &&
				!isRioux(author)
			) {
				return Either.left({
					type: 'OTHER' as const,
					code: 403,
					message: 'You do not have permission to do that',
				});
			}

			if (!accountID.startsWith(parentAccount.id)) {
				return Either.left({
					type: 'OTHER' as const,
					code: 400,
					message: `The account ID must start with '${parentAccount.id}'`,
				});
			}

			if (accountID === parentAccount.id) {
				return Either.left({
					type: 'OTHER' as const,
					code: 400,
					message: 'Cannot create duplicate account',
				});
			}

			return AsyncEither.All([
				getAccount(schema)(accountID)
					.map<AccountObject | null>(identity)
					.leftFlatMap(always(Either.right<ServerError, AccountObject | null>(null))),
				asyncRight(
					session.startTransaction(),
					errorGenerator('Could not create save point'),
				),
			]);
		})(),
		errorGenerator('Could not create a CAP Event account'),
	)
		.flatMap(identity)
		.filter(([account]) => account === null, {
			type: 'OTHER',
			code: 400,
			message: 'Cannot create duplicate account',
		})
		.map(
			() => createGoogleCalendarForEvent(newEvent.name, accountName, accountID, config),
			errorGenerator('Could not create Google calendar'),
		)
		.map<RawCAPEventAccountObject>(mainCalendarID => ({
			aliases: [],
			comments: '',
			discordServer: Maybe.none(),
			id: accountID,
			mainCalendarID,
			parent: Maybe.some(parentAccount.id),
			wingCalendarID: parentAccount.mainCalendarID,

			type: AccountType.CAPEVENT,
		}))
		.flatMap(addToCollection(schema.getCollection<RawCAPEventAccountObject>('Accounts')))
		// Account setup
		.tap(newAccount =>
			AsyncEither.All([
				getRegistry(schema)(newAccount)
					.map(registry => ({
						...registry,
						Website: {
							...registry.Website,
							Name: accountName,
						},
					}))
					.flatMap(saveRegistry(schema)),
				asyncRight(
					setPermissionsForMemberInAccount(
						schema,
						toReference(author),
						getDefaultAdminPermissions(AccountType.CAPEVENT),
						newAccount,
					),
					errorGenerator('Could not set permissions for member in new account'),
				),
			]),
		)
		.tap(newAccount =>
			promisify(copyFile)(
				join(config.GOOGLE_KEYS_PATH, `${parentAccount.id}.json`),
				join(config.GOOGLE_KEYS_PATH, `${newAccount.id}.json`),
			),
		)
		.tap(newAccount =>
			createEventFunc(now)(config)(schema)(newAccount)(toReference(author))(newEvent)
				.map<RawRegularEventObject>(event => event as RawRegularEventObject)
				.tap(event =>
					addMemberToAttendanceFunc(now)(schema)(newAccount)({
						...event,
						attendance: [],
						pointsOfContact: event.pointsOfContact as FullPointOfContact[],
					})({
						comments: '',
						customAttendanceFieldValues: applyCustomAttendanceFields(
							newEvent.customAttendanceFields,
						)([]),
						memberID: toReference(author),
						planToUseCAPTransportation: false,
						shiftTime: null,
						status: AttendanceStatus.COMMITTEDATTENDED,
					}),
				)
				.tap(event => linkEvent(config)(schema)(event)(toReference(author))(parentAccount)),
		)
		.tap(() => session.commit())
		.leftTap(() => session.rollback());
export const createCAPEventAccount = createCAPEventAccountFunc(Date.now);

export interface AccountGetter {
	byId: typeof getAccount;
	byOrgid: typeof getCAPAccountsForORGID;
}

export const getMemoizedAccountGetter = (schema: Schema): AccountGetter => ({
	byId: always(memoize(getAccount(schema))),
	byOrgid: always(memoize(getCAPAccountsForORGID(schema))),
});

export const getAccount = (schema: Schema) => (accountID: string) =>
	asyncRight(
		schema.getCollection<AccountObject>('Accounts'),
		errorGenerator('Could not get accounts'),
	)
		.map(collection => generateResults(collection.find('true')))
		.map<AsyncIterableIterator<AccountObject>>(
			asyncIterFilter(
				(account): account is AccountObject =>
					account.id === accountID || account.aliases.includes(accountID),
			),
		)
		.map(collectGeneratorAsync)
		.filter(ofLength(1), {
			code: 404,
			type: 'OTHER',
			message: 'Could not find account',
		})
		.map(items => items[0]);

export const getCAPAccountsForORGID = (schema: Schema) => (orgid: number) =>
	asyncEitherIterMap<CAPAccountObject, CAPAccountObject>(
		stripProp('_id') as (obj: CAPAccountObject) => CAPAccountObject,
	)(
		asyncIterHandler<CAPAccountObject>(errorGenerator('Could not get account for member'))(
			asyncIterFilter(
				statefulFunction<{ [key: string]: boolean }>({})<AccountObject, boolean>(
					(account, state) => [!state[account.id], { ...state, [account.id]: true }],
				),
			)(
				asyncIterConcat<CAPAccountObject>(
					generateResults(
						schema
							.getCollection<
								| RawCAPGroupAccountObject
								| RawCAPWingAccountObject
								| RawCAPRegionAccountObject
							>('Accounts')
							.find('orgid = :orgid')
							.bind('orgid', orgid),
					),
				)(() =>
					asyncIterConcat<AccountObject>(
						generateResults<AccountObject>(
							schema
								.getCollection<RawCAPSquadronAccountObject>('Accounts')
								.find('mainOrg = :mainOrg')
								.bind('mainOrg', orgid),
						),
					)(() =>
						generateResults<AccountObject>(
							schema
								.getCollection<RawCAPSquadronAccountObject>('Accounts')
								.find(':orgIDs in orgIDs')
								.bind('orgIDs', orgid),
						),
					),
				),
			),
		),
	);

export const buildURI = (account: AccountObject) => (...identifiers: string[]) =>
	(process.env.NODE_ENV === 'development'
		? `/`
		: `https://${account.id}.${process.env.REACT_APP_HOST_NAME}/`) +
	[].slice.call(identifiers).join('/');

export const getMembers = (schema: Schema) => (account: AccountObject) =>
	async function*(type?: MemberType | undefined) {
		const teamObjects = await getTeamObjects(schema)(account)
			.map(collectGeneratorAsync)
			.cata(() => [], identity);

		const foundMembers: { [key: string]: boolean } = {};

		if (account.type === AccountType.CAPSQUADRON) {
			if (type === 'CAPNHQMember' || type === undefined) {
				const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');

				for (const ORGID of account.orgIDs) {
					const memberFind = findAndBind(memberCollection, {
						ORGID,
					});

					for await (const member of generateResults(memberFind)) {
						foundMembers[
							stringifyMemberReference({ type: 'CAPNHQMember', id: member.CAPID })
						] = true;

						const mem = await CAP.expandNHQMember(schema)(account)(teamObjects)(member);

						yield mem;
					}
				}
			}

			if (type === 'CAPProspectiveMember' || type === undefined) {
				const prospectiveMembersCollection = schema.getCollection<
					StoredProspectiveMemberObject
				>('ProspectiveMembers');

				const prospectiveMemberFind = findAndBind(prospectiveMembersCollection, {
					accountID: account.id,
				});

				for await (const prospectiveMember of generateResults(prospectiveMemberFind)) {
					foundMembers[stringifyMemberReference(prospectiveMember)] = true;

					if (prospectiveMember.hasNHQReference) {
						continue;
					}

					yield CAP.expandProspectiveMember(schema)(account)(teamObjects)(
						prospectiveMember,
					);
				}
			}
		} else if (
			account.type === AccountType.CAPGROUP ||
			account.type === AccountType.CAPWING ||
			account.type === AccountType.CAPREGION
		) {
			if (type === 'CAPNHQMember' || type === undefined) {
				const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');

				const memberFind = findAndBind(memberCollection, {
					ORGID: account.orgid,
				});

				for await (const member of generateResults(memberFind)) {
					foundMembers[
						stringifyMemberReference({ type: 'CAPNHQMember', id: member.CAPID })
					] = true;

					yield CAP.expandNHQMember(schema)(account)(teamObjects)(member);
				}
			}
		} else if (account.type === AccountType.CAPEVENT) {
			const attendanceCollection = schema.getCollection<{
				accountID: string;
				memberID: MemberReference;
			}>('Attendance');

			const accountEvents = generateResults(
				findAndBind(attendanceCollection, { accountID: account.id })
					.fields(['accountID', 'memberID'])
					.groupBy(['accountID', 'memberID']),
			);

			for await (const record of accountEvents) {
				const memberID = record.memberID;

				if (type !== undefined && memberID.type !== type) {
					continue;
				}

				foundMembers[stringifyMemberReference(memberID)] = true;

				yield resolveReference(schema)(account)(memberID);
			}
		}

		const extraMemberCollection = schema.getCollection<StoredAccountMembership>(
			'ExtraAccountMembership',
		);

		const extraMembersGenerator = generateResults(
			findAndBind(extraMemberCollection, { accountID: account.id })
				.fields(['member'])
				.groupBy(['member']),
		);

		for await (const record of extraMembersGenerator) {
			if (!foundMembers[stringifyMemberReference(record.member)]) {
				if (type !== undefined && record.member.type !== type) {
					continue;
				}

				yield resolveReference(schema)(account)(record.member);
			}
		}
	};

export const getMemberIDs = (schema: Schema) =>
	async function*(account: AccountObject): AsyncIter<MemberReference> {
		const foundMembers: { [key: string]: boolean } = {};

		if (account.type === AccountType.CAPSQUADRON) {
			const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');

			for (const ORGID of account.orgIDs) {
				const memberFind = findAndBind(memberCollection, {
					ORGID,
				});

				for await (const member of generateResults(memberFind)) {
					const memberID = {
						type: 'CAPNHQMember' as const,
						id: member.CAPID,
					};

					foundMembers[stringifyMemberReference(memberID)] = true;

					yield memberID;
				}
			}

			const prospectiveMembersCollection = schema.getCollection<CAPProspectiveMemberObject>(
				'ProspectiveMembers',
			);

			const prospectiveMemberFind = findAndBind(prospectiveMembersCollection, {
				accountID: account.id,
			});

			for await (const prospectiveMember of generateResults(prospectiveMemberFind)) {
				foundMembers[stringifyMemberReference(toReference(prospectiveMember))] = true;

				yield toReference(prospectiveMember);
			}
		} else if (
			account.type === AccountType.CAPGROUP ||
			account.type === AccountType.CAPWING ||
			account.type === AccountType.CAPREGION
		) {
			const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');

			const memberFind = findAndBind(memberCollection, {
				ORGID: account.orgid,
			});

			for await (const member of generateResults(memberFind)) {
				const memberID = {
					type: 'CAPNHQMember' as const,
					id: member.CAPID,
				};

				foundMembers[stringifyMemberReference(memberID)] = true;

				yield memberID;
			}
		} else if (account.type === AccountType.CAPEVENT) {
			const attendanceCollection = schema.getCollection<{
				memberID: MemberReference;
				accountID: string;
			}>('Attendance');

			const accountEvents = generateResults(
				findAndBind(attendanceCollection, { accountID: account.id })
					.fields(['memberID', 'accountID'])
					.groupBy(['memberID', 'accountID']),
			);

			for await (const record of accountEvents) {
				const memberID = record.memberID;

				foundMembers[stringifyMemberReference(memberID)] = true;

				yield memberID;
			}
		}

		const extraMemberCollection = schema.getCollection<StoredAccountMembership>(
			'ExtraAccountMembership',
		);

		const extraMembersGenerator = generateResults(
			findAndBind(extraMemberCollection, { accountID: account.id })
				.fields(['member'])
				.groupBy(['member']),
		);

		for await (const record of extraMembersGenerator) {
			if (!foundMembers[stringifyMemberReference(record.member)]) {
				yield record.member;
			}
		}
	};

export const getFiles = (includeWWW = true) => (schema: Schema) => (account: AccountObject) => {
	const fileCollection = schema.getCollection<FileObject>('Files');

	return generateResults(
		includeWWW
			? safeBind(fileCollection.find('accountID = :accountID or accountID = "www"'), {
					accountID: account.id,
			  })
			: findAndBind(fileCollection, { accountID: account.id }),
	);
};

export const getEvents = (schema: Schema) => (
	account: AccountObject,
): AsyncIterator<EitherObj<ServerError, RawEventObject>> => {
	const eventCollection = schema.getCollection<RawEventObject>('Events');

	const find = eventCollection.find(`accountID = :accountID`).bind('accountID', account.id);

	return asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(find),
		),
	);
};

export const queryEvents = (query: string) => (schema: Schema) => (account: AccountObject) => (
	bind: any,
) =>
	asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(queryEventsFind(query)(schema)(account)(bind)),
		),
	);

export const queryEventsFind = (query: string) => (schema: Schema) => (account: AccountObject) => (
	bind: any,
) => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const find = eventCollection
		.find(`accountID = :accountID AND (${query})`)
		.bind('accountID', account.id)
		.bind(bind);

	return find;
};

export const getEventsInRange = (schema: Schema) => (account: AccountObject) => (start: number) => (
	end: number,
) => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const iterator = eventCollection
		.find(
			'accountID = :accountID AND ((pickupDateTime > :pickupDateTime AND pickupDateTime < :meetDateTime) OR (meetDateTime < :meetDateTime AND meetDateTime > :pickupDateTime))',
		)
		.bind('accountID', account.id)
		.bind('pickupDateTime', start)
		.bind('meetDateTime', end);

	return asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(iterator),
		),
	);
};

export const saveAccount = (schema: Schema) => async (account: AccountObject) => {
	const collection = schema.getCollection<AccountObject>('Accounts');

	await collection
		.modify('id = :id')
		.bind('id', account.id)
		.patch(account)
		.execute();
};

const getNormalTeamObjects = (schema: Schema) => (
	account: AccountObject,
): ServerEither<AsyncIterableIterator<RawTeamObject>> =>
	asyncRight(
		schema.getCollection<RawTeamObject>('Teams'),
		errorGenerator('Could not get teams for account'),
	)
		.map(
			findAndBindC<RawTeamObject>({
				accountID: account.id,
			}),
		)
		.map(generateResults);

export const getTeamObjects = (schema: Schema) => (
	account: AccountObject,
): ServerEither<AsyncIterableIterator<RawTeamObject>> =>
	account.type === AccountType.CAPSQUADRON
		? getStaffTeam(schema)(account).flatMap(team =>
				getNormalTeamObjects(schema)(account).map(objectIter =>
					asyncIterConcat(yieldObjAsync(Promise.resolve(team)))(() => objectIter),
				),
		  )
		: getNormalTeamObjects(schema)(account);

export const getSortedEvents = (schema: Schema) => (account: AccountObject) => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const eventIterator = findAndBind(eventCollection, {
		accountID: account.id,
	}).sort('pickupDateTime ASC');

	return generateResults(eventIterator);
};

const getCAPOrganization = (schema: Schema) => (ORGID: number) =>
	asyncRight(
		schema.getCollection<NHQ.Organization>('NHQ_Organization'),
		errorGenerator('Could not get CAP Organization data'),
	)
		.map(
			findAndBindC<NHQ.Organization>({
				ORGID,
			}),
		)
		.map(collectResults)
		.map(Maybe.fromArray);

export const getOrgName = (accountGetter: Partial<AccountGetter>) => (schema: Schema) => (
	account: AccountObject,
) => {
	const orgInfoGetter = memoize(getCAPOrganization(schema));
	const getter: AccountGetter = {
		byId: getAccount,
		byOrgid: getCAPAccountsForORGID,
		...accountGetter,
	};
	const registryByIdGetter = memoize(getRegistryById(schema));

	return (member: Member): ServerEither<MaybeObj<string>> => {
		switch (member.type) {
			case 'CAPNHQMember':
				return asyncRight(
					collectGeneratorAsync(getter.byOrgid(schema)(member.orgid)),
					errorGenerator('Could not get Accounts'),
				)
					.map(onlyRights)
					.map(results =>
						results.filter(({ id }) => id === account.id).length === 1
							? [account]
							: results,
					)
					.flatMap(results =>
						results.length === 1
							? registryByIdGetter(results[0].id)
									.map(get('Website'))
									.map(get('Name'))
									.map(Maybe.some)
							: orgInfoGetter(member.orgid).map(Maybe.map(get('Name'))),
					);

			case 'CAPProspectiveMember':
				return registryByIdGetter(member.accountID)
					.map(get('Website'))
					.map(get('Name'))
					.map(Maybe.some);
		}
	};
};
