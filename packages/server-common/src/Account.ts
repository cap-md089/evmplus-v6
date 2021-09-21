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

import { CollectionFind, Schema, Session } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	always,
	applyCustomAttendanceFields,
	asyncEither,
	AsyncEither,
	AsyncIter,
	asyncIterConcat2,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncIterRaiseEither,
	asyncRight,
	AttendanceStatus,
	BasicMySQLRequest,
	CAPAccountObject,
	CAPNHQMemberObject,
	CAPProspectiveMemberObject,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	EventObject,
	FileObject,
	FromDatabase,
	get,
	getDefaultAdminPermissions,
	getORGIDsFromRegularCAPAccount,
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
	ParamType,
	pipe,
	RawCAPEventAccountObject,
	RawCAPGroupAccountObject,
	RawCAPRegionAccountObject,
	RawCAPSquadronAccountObject,
	RawCAPWingAccountObject,
	RawEventObject,
	RawRegularEventObject,
	Right,
	ServerConfiguration,
	ServerError,
	statefulFunction,
	StoredAccountMembership,
	stringifyMemberReference,
	stripProp,
	TableDataType,
	toReference,
} from 'common-lib';
import { copyFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { AttendanceBackend } from './Attendance';
import {
	Backends,
	combineBackends,
	notImplementedError,
	notImplementedException,
	TimeBackend,
} from './backends';
import { EventsBackend } from './Event';
import { createGoogleCalendarForEvent } from './GoogleUtils';
import { PAMBackend } from './member/pam';
import { CAP, resolveReference } from './Members';
import {
	addToCollection,
	bindForArray,
	collectResults,
	findAndBind,
	findAndBindC,
	generateResults,
	getRawMySQLBackend,
	RawMySQLBackend,
	safeBind,
} from './MySQLUtil';
import { getRegistry, getRegistryBackend, RegistryBackend, saveRegistry } from './Registry';
import { ServerEither } from './servertypes';
import { TeamsBackend } from './Team';

export interface BasicAccountRequest<P extends ParamType = {}, B = any>
	extends BasicMySQLRequest<P, B> {
	account: AccountObject;
	backend: Backends<[RawMySQLBackend, AccountBackend, RegistryBackend]>;
}

export const getAccountID = (hostname: string): EitherObj<ServerError, string> =>
	Either.flatMap<ServerError, string[], string>(parts => {
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
		} else if (hostname === 'events.md.cap.gov') {
			return Either.right('md001');
		} else {
			// Could now be a hostname like events.md.cap.gov or md089.events.md.cap.gov
			// What's worse, that means implying a default account ID (md001) for a subset
			// of URLs
			return Either.right(parts[0]);
		}
	})(Either.right(hostname.split('.')));

export const accountRequestTransformer = <T extends BasicMySQLRequest>(
	req: T,
): AsyncEither<ServerError, T & BasicAccountRequest> =>
	asyncRight(
		combineBackends<T, [RawMySQLBackend, RegistryBackend, AccountBackend]>(
			getRawMySQLBackend,
			getRegistryBackend,
			getAccountBackend,
		)(req),
		errorGenerator('Could not get account'),
	).flatMap(backend =>
		asyncEither(getAccountID(req.hostname), errorGenerator('Could not get account'))
			.flatMap(backend.getAccount)
			.map(account => ({ ...req, headers: req.headers, account, backend })),
	);

export const createCAPEventAccountFunc = (
	backend: Backends<[TimeBackend, AttendanceBackend, EventsBackend, PAMBackend]>,
) => (config: ServerConfiguration) => (session: Session) => (schema: Schema) => (
	parentAccount: RawCAPWingAccountObject,
) => (author: Member) => (accountID: string) => (accountName: string) => (
	newEvent: NewEventObject,
): ServerEither<RawCAPEventAccountObject> =>
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
				backend.setPermissions(newAccount)(toReference(author))(
					getDefaultAdminPermissions(AccountType.CAPEVENT),
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
			backend
				.createEvent(newAccount)(toReference(author))(newEvent)
				.map<RawRegularEventObject>(event => event as RawRegularEventObject)
				.tap(event =>
					backend.addMemberToAttendance(event)(false)({
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
				.tap(event => backend.linkEvent(event)(toReference(author))(parentAccount)),
		)
		.tap(() => session.commit())
		.leftTap(() => session.rollback());

export const getAccount = (schema: Schema) => (accountID: string): ServerEither<AccountObject> =>
	asyncRight(
		schema.getCollection<AccountObject>('Accounts'),
		errorGenerator(`Could not get accounts with ID '${accountID}'`),
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

export const getCAPAccountsForORGID = (schema: Schema) => (
	orgid: number,
): ServerEither<CAPAccountObject[]> =>
	pipe(
		asyncIterFilter(
			statefulFunction<{ [key: string]: boolean }>({})<AccountObject, boolean>(
				(account, state) => [!state[account.id], { ...state, [account.id]: true }],
			),
		),
		asyncIterMap<CAPAccountObject, CAPAccountObject>(
			stripProp('_id') as (obj: CAPAccountObject) => CAPAccountObject,
		),
		collectGeneratorAsync,
		results => asyncRight(results, errorGenerator('Could not get account objects')),
	)(
		asyncIterConcat2<CAPAccountObject>(
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
			generateResults<CAPAccountObject>(
				schema
					.getCollection<RawCAPSquadronAccountObject>('Accounts')
					.find('mainOrg = :mainOrg')
					.bind('mainOrg', orgid),
			),
			generateResults<AccountObject>(
				schema
					.getCollection<RawCAPSquadronAccountObject>('Accounts')
					.find(':orgIDs in orgIDs')
					.bind('orgIDs', orgid),
			),
		),
	);

export const getMembers = (schema: Schema) => (
	backend: Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
) => (account: AccountObject) =>
	async function* (
		type?: MemberType | undefined,
	): AsyncGenerator<
		EitherObj<ServerError, CAPProspectiveMemberObject | CAPNHQMemberObject>,
		void,
		undefined
	> {
		const foundMembers: { [key: string]: boolean } = {};

		if (account.type === AccountType.CAPSQUADRON) {
			if (type === 'CAPNHQMember' || type === undefined) {
				const membersForORGIDs = await backend.getNHQMembersInAccount(backend)(account);

				if (Either.isLeft(membersForORGIDs)) {
					yield membersForORGIDs;
				} else {
					if (Maybe.isNone(membersForORGIDs.value)) {
						return;
					}

					membersForORGIDs.value.value.forEach(mem => {
						foundMembers[stringifyMemberReference(mem)] = true;
					});
					yield* membersForORGIDs.value.value.map(Either.right);
				}
			}

			if (type === 'CAPProspectiveMember' || type === undefined) {
				const membersForAccount = await backend.getProspectiveMembersInAccount(backend)(
					account,
				);

				if (Either.isLeft(membersForAccount)) {
					yield membersForAccount;
				} else {
					membersForAccount.value.forEach(mem => {
						foundMembers[stringifyMemberReference(mem)] = true;
					});
					yield* membersForAccount.value.map(Either.right);
				}
			}
		} else if (
			account.type === AccountType.CAPGROUP ||
			account.type === AccountType.CAPWING ||
			account.type === AccountType.CAPREGION
		) {
			if (type === 'CAPNHQMember' || type === undefined) {
				const membersForORGIDs = await backend.getNHQMembersInAccount(backend)(account);

				if (Either.isLeft(membersForORGIDs)) {
					yield membersForORGIDs;
				} else {
					if (Maybe.isNone(membersForORGIDs.value)) {
						return;
					}

					membersForORGIDs.value.value.forEach(mem => {
						foundMembers[stringifyMemberReference(mem)] = true;
					});
					yield* membersForORGIDs.value.value.map(Either.right);
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

				yield resolveReference(schema)(backend)(account)(memberID);
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

				yield resolveReference(schema)(backend)(account)(record.member);
			}
		}
	};

export const getMemberIDs = (schema: Schema) =>
	async function* (account: AccountObject): AsyncIter<MemberReference> {
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

export const getFiles = (includeWWW = true) => (schema: Schema) => (
	account: AccountObject,
): AsyncIter<FileObject> => {
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
): AsyncIter<EitherObj<ServerError, RawEventObject>> => {
	const eventCollection = schema.getCollection<RawEventObject>('Events');

	const find = eventCollection.find(`accountID = :accountID`).bind('accountID', account.id);

	return asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(find),
		),
	);
};

export const queryEvents = (query: string) => (schema: Schema) => (account: AccountObject) => (
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	bind: any,
): AsyncIter<EitherObj<ServerError, RawEventObject>> =>
	asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(queryEventsFind(query)(schema)(account)(bind)),
		),
	);

export const queryEventsFind = (query: string) => (schema: Schema) => (account: AccountObject) => (
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	bind: any,
): CollectionFind<FromDatabase<EventObject>> => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const find = eventCollection
		.find(`accountID = :accountID AND (${query})`)
		.bind('accountID', account.id)
		.bind(bind);

	return find;
};

export const getEventsInRange = (schema: Schema) => (account: AccountObject) => (start: number) => (
	end: number,
): AsyncIter<EitherObj<ServerError, FromDatabase<RawEventObject>>> => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const iterator = eventCollection
		.find(
			'accountID = :accountID AND ((pickupDateTime > :pickupDateTime AND pickupDateTime < :meetDateTime) OR (meetDateTime < :meetDateTime AND meetDateTime > :pickupDateTime))',
		)
		.bind('accountID', account.id)
		.bind('pickupDateTime', start)
		.bind('meetDateTime', end);

	return asyncIterHandler<FromDatabase<RawEventObject>>(
		errorGenerator('Could not get event for account'),
	)(generateResults(iterator));
};

export const saveAccount = (schema: Schema) => async (account: AccountObject): Promise<void> => {
	const collection = schema.getCollection<AccountObject>('Accounts');

	await collection.modify('id = :id').bind('id', account.id).patch(account).execute();
};

export const getSortedEvents = (schema: Schema) => (
	account: AccountObject,
): AsyncIter<FromDatabase<RawEventObject>> => {
	const eventCollection = schema.getCollection<FromDatabase<EventObject>>('Events');

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

export const getOrgNameForMember = (
	orgInfoGetter: (ORGID: number) => ServerEither<MaybeObj<NHQ.Organization>>,
) => (backend: Backends<[AccountBackend, RegistryBackend]>) => (account: AccountObject) => (
	member: Member,
): ServerEither<MaybeObj<string>> => {
	switch (member.type) {
		case 'CAPNHQMember':
			return backend
				.getCAPAccountsByORGID(member.orgid)
				.map(results =>
					results.filter(({ id }) => id === account.id).length === 1
						? [account]
						: results,
				)
				.flatMap(results =>
					results.length === 1
						? backend
								.getRegistryUnsafe(results[0].id)
								.map(get('Website'))
								.map(get('Name'))
								.map(Maybe.some)
						: orgInfoGetter(member.orgid).map(Maybe.map(get('Name'))),
				);

		case 'CAPProspectiveMember':
			return backend
				.getRegistryUnsafe(member.accountID)
				.map(get('Website'))
				.map(get('Name'))
				.map(Maybe.some);
	}
};

const orgidQuerySQL = (schema: Schema, orgids: number[]): string => /* sql */ `\
WITH RECURSIVE Units AS (
        SELECT
                doc ->> '$.ORGID' as id,
                doc ->> '$.Name' as name,
                doc ->> '$.NextLevel' as parent
        FROM
                ${schema.getName()}.NHQ_Organization
        WHERE
                doc ->> '$.ORGID' in ${bindForArray(orgids)}
        UNION ALL
        SELECT
                O.doc ->> '$.ORGID',
                O.doc ->> '$.Name',
                O.doc ->> '$.NextLevel'
        FROM Units AS U
        JOIN ${schema.getName()}.NHQ_Organization AS O
        ON O.doc ->> '$.NextLevel' = U.id
)
SELECT id FROM Units;`;

export const getSubordinateCAPUnits = (backend: AccountBackend) => (schema: Schema) => (
	wing: RawCAPWingAccountObject,
): ServerEither<CAPAccountObject[]> =>
	asyncRight(schema.getSession(), errorGenerator('Could not get subordinate unit ORG IDs'))
		.map(session =>
			session
				.sql(orgidQuerySQL(schema, getORGIDsFromRegularCAPAccount(wing)))
				.bind(getORGIDsFromRegularCAPAccount(wing))
				.execute(),
		)
		.map(result => result.fetchAll().map(([value]: [number]) => value))
		.map(asyncIterMap(backend.getCAPAccountsByORGID))
		.flatMap(asyncIterRaiseEither(errorGenerator('Could not get subordinate unit information')))
		.map(accounts => accounts.flatMap(identity));

export interface AccountBackend {
	getAccount: (accountID: string) => ServerEither<AccountObject>;
	getCAPAccountsByORGID: (orgid: number) => ServerEither<CAPAccountObject[]>;
	getMembers: (
		backend: Backends<[CAP.CAPMemberBackend, TeamsBackend]>,
	) => (account: AccountObject) => (type?: MemberType | undefined) => ServerEither<Member[]>;
	queryEvents: (
		query: string,
	) => (
		account: AccountObject,
	) => (bind: any) => CollectionFind<FromDatabase<TableDataType<'Events'>>>;
	getSortedEvents: (account: AccountObject) => AsyncIter<TableDataType<'Events'>>;
	getEventsInRange: (
		account: AccountObject,
	) => (
		range: [start: number, end: number],
	) => AsyncIter<EitherObj<ServerError, FromDatabase<TableDataType<'Events'>>>>;
	createCAPEventAccount: (
		backend: Backends<[TimeBackend, AttendanceBackend, EventsBackend, PAMBackend]>,
	) => (
		parent: RawCAPWingAccountObject,
	) => (
		author: Member,
	) => (
		accountID: string,
	) => (
		accountName: string,
	) => (newEvent: NewEventObject) => ServerEither<RawCAPEventAccountObject>;
	getOrgNameForMember: (
		account: AccountObject,
	) => (member: Member) => ServerEither<MaybeObj<string>>;
	getSubordinateCAPUnits: (wing: RawCAPWingAccountObject) => ServerEither<CAPAccountObject[]>;
}

export const getAccountBackend = (
	req: BasicMySQLRequest | BasicAccountRequest,
	prevBackend: RegistryBackend,
): AccountBackend =>
	'backend' in req
		? req.backend
		: {
				...getRequestFreeAccountsBackend(req.mysqlx, prevBackend),
				createCAPEventAccount: eventsBackend => parent => author => accountID => accountName => newEvent =>
					createCAPEventAccountFunc(eventsBackend)(req.configuration)(req.mysqlxSession)(
						req.mysqlx,
					)(parent)(author)(accountID)(accountName)(newEvent),
		  };

export const getRequestFreeAccountsBackend = (
	mysqlx: Schema,
	prevBackend: Backends<[RegistryBackend]>,
): AccountBackend => {
	const getCAPOrgInfo = memoize(getCAPOrganization(mysqlx));

	const backend: AccountBackend = {
		getAccount: memoize(getAccount(mysqlx)),
		getCAPAccountsByORGID: memoize(getCAPAccountsForORGID(mysqlx)),
		getMembers: memoize(memberBackend =>
			memoize(account =>
				memoize(type =>
					asyncRight(
						getMembers(mysqlx)(memberBackend)(account)(type),
						errorGenerator('Could not get member list'),
					)
						.map(
							asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(
								Either.isRight,
							),
						)
						.map(asyncIterMap(get('value')))
						.map(collectGeneratorAsync),
				),
			),
		),
		queryEvents: query => account => bind => queryEventsFind(query)(mysqlx)(account)(bind),
		getSortedEvents: account => getSortedEvents(mysqlx)(account),
		getEventsInRange: account => ([start, end]) =>
			getEventsInRange(mysqlx)(account)(start)(end),
		createCAPEventAccount: () => () => () => () => () => () =>
			notImplementedError('createCAPEventAccount'),
		getOrgNameForMember: memoize(
			account =>
				memoize(
					getOrgNameForMember(getCAPOrgInfo)({ ...prevBackend, ...backend })(account),
					stringifyMemberReference,
				),
			get('id'),
		),
		getSubordinateCAPUnits: wing => getSubordinateCAPUnits(backend)(mysqlx)(wing),
	};

	return backend;
};

export const getEmptyAccountBackend = (): AccountBackend => ({
	getAccount: () => notImplementedError('getAccount'),
	getCAPAccountsByORGID: () => notImplementedError('getCAPAccountsByORGID'),
	getMembers: () => () => () => notImplementedError('getMembers'),
	queryEvents: () => () => () => notImplementedException('queryEvents'),
	getSortedEvents: () => notImplementedException('getSortedEvents'),
	getEventsInRange: () => () => notImplementedException('getEventsInRange'),
	createCAPEventAccount: () => () => () => () => () => () =>
		notImplementedError('createCAPEventAccount'),
	getOrgNameForMember: () => () => notImplementedError('getOrgName'),
	getSubordinateCAPUnits: () => notImplementedError('getSubordinateCAPUnits'),
});
