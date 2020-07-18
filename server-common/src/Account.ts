import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	AsyncEither,
	asyncEitherIterMap,
	AsyncIter,
	asyncIterConcat,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncRight,
	BasicMySQLRequest,
	CAPAccountObject,
	CAPProspectiveMemberObject,
	collectGeneratorAsync,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	EventObject,
	FileObject,
	get,
	identity,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	memoize,
	NewCAPEventAccountObject,
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
	RawTeamObject,
	ServerError,
	statefulFunction,
	StoredAccountMembership,
	stringifyMemberReference,
	stripProp,
	toReference,
	yieldObjAsync,
} from 'common-lib';
import { CAP, resolveReference } from './Members';
import { collectResults, findAndBind, findAndBindC, generateResults, safeBind } from './MySQLUtil';
import { getRegistryById } from './Registry';
import { ServerEither } from './servertypes';
import { getStaffTeam } from './Team';

export interface BasicAccountRequest<P extends ParamType = {}, B = any>
	extends BasicMySQLRequest<P, B> {
	account: AccountObject;
}

export const accountRequestTransformer = <T extends BasicMySQLRequest>(
	req: T
): AsyncEither<ServerError, T & BasicAccountRequest> =>
	asyncRight(req.hostname.split('.'), errorGenerator('Could not get account'))
		.flatMap<string>(parts => {
			while (parts[0] === 'www') {
				parts.shift();
			}

			if (parts.length === 1 && process.env.NODE_ENV === 'development') {
				// localhost
				return Either.right('md089');
			} else if (parts.length === 2) {
				// capunit.com
				return Either.right('sales');
			} else if (parts.length === 3) {
				// md089.capunit.com
				return Either.right(parts[0]);
			} else if (parts.length === 4 && process.env.NODE_ENV === 'development') {
				// 192.168.1.128
				return Either.right('md089');
			} else {
				// IP/localhost in production, otherwise invalid hostname
				return Either.left({
					type: 'OTHER',
					code: 400,
					message: 'Could not get account ID from URL',
				});
			}
		})
		.flatMap(getAccount(req.mysqlx))
		.map(account => ({ ...req, account }));

export const createCAPEventAccount = (schema: Schema) => (account: NewCAPEventAccountObject) =>
	asyncRight(
		schema.getCollection<AccountObject>('Accounts'),
		errorGenerator('Could not create a CAP Event account')
	)
		.map(collection =>
			collection
				.add({
					...account,
					comments: '',
					type: AccountType.CAPEVENT,
				} as RawCAPEventAccountObject)
				.execute()
		)
		.map(destroy);

export interface AccountGetter {
	byId: typeof getAccount;
	byOrgid: typeof getCAPAccountsForORGID;
}

export const getAccount = (schema: Schema) => (accountID: string) =>
	asyncRight(
		schema.getCollection<AccountObject>('Accounts'),
		errorGenerator('Could not get accounts')
	)
		.map(collection => generateResults(collection.find('true')))
		.map<AsyncIterableIterator<AccountObject>>(
			asyncIterFilter(
				(account): account is AccountObject =>
					account.id === accountID || account.aliases.includes(accountID)
			)
		)
		.map(collectGeneratorAsync)
		.filter(ofLength(1), {
			code: 400,
			type: 'OTHER',
			message: 'Could not find account',
		})
		.map(items => items[0]);

export const getCAPAccountsForORGID = (schema: Schema) => (orgid: number) =>
	asyncEitherIterMap<CAPAccountObject, CAPAccountObject>(
		stripProp('_id') as (obj: CAPAccountObject) => CAPAccountObject
	)(
		asyncIterHandler<CAPAccountObject>(errorGenerator('Could not get account for member'))(
			asyncIterFilter(
				statefulFunction<{ [key: string]: boolean }>({})<AccountObject, boolean>(
					(acc, state) => [!!state[acc.id], { ...state, [acc.id]: true }]
				)
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
							.bind('orgid', orgid)
					)
				)(() =>
					asyncIterConcat<AccountObject>(
						generateResults<AccountObject>(
							schema
								.getCollection<RawCAPSquadronAccountObject>('Accounts')
								.find('mainOrg = :mainOrg')
								.bind('mainOrg', orgid)
						)
					)(() =>
						generateResults<AccountObject>(
							schema
								.getCollection<RawCAPSquadronAccountObject>('Accounts')
								.find(':orgIDs in orgIDs')
								.bind('orgIDs', orgid)
						)
					)
				)
			)
		)
	);

export const buildURI = (account: AccountObject) => (...identifiers: string[]) =>
	(process.env.NODE_ENV === 'development' ? `/` : `https://${account.id}.capunit.com/`) +
	[].slice.call(identifiers).join('/');

export const getMembers = (schema: Schema) =>
	async function* (account: AccountObject) {
		const teamObjects = await getTeamObjects(schema)(account)
			.map(collectGeneratorAsync)
			.cata(() => [], identity);

		const foundMembers: { [key: string]: boolean } = {};

		if (account.type === AccountType.CAPSQUADRON) {
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

			const prospectiveMembersCollection = schema.getCollection<CAPProspectiveMemberObject>(
				'ProspectiveMembers'
			);

			const prospectiveMemberFind = findAndBind(prospectiveMembersCollection, {
				accountID: account.id,
			});

			for await (const prospectiveMember of generateResults(prospectiveMemberFind)) {
				foundMembers[stringifyMemberReference(prospectiveMember)] = true;

				yield CAP.expandProspectiveMember(schema)(account)(teamObjects)(prospectiveMember);
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
				foundMembers[
					stringifyMemberReference({ type: 'CAPNHQMember', id: member.CAPID })
				] = true;

				yield CAP.expandNHQMember(schema)(account)(teamObjects)(member);
			}
		} else if (account.type === AccountType.CAPEVENT) {
			const attendanceCollection = schema.getCollection<{
				accountID: string;
				memberID: MemberReference;
			}>('Attendance');

			const accountEvents = generateResults(
				findAndBind(attendanceCollection, { accountID: account.id })
					.fields(['accountID', 'memberID'])
					.groupBy(['accountID', 'memberID'])
			);

			for await (const record of accountEvents) {
				const memberID = record.memberID;

				foundMembers[stringifyMemberReference(memberID)] = true;

				yield resolveReference(schema)(account)(memberID);
			}
		}

		const extraMemberCollection = schema.getCollection<StoredAccountMembership>(
			'ExtraAccountMembership'
		);

		const extraMembersGenerator = generateResults(
			findAndBind(extraMemberCollection, { accountID: account.id })
				.fields(['member'])
				.groupBy(['member'])
		);

		for await (const record of extraMembersGenerator) {
			if (!foundMembers[stringifyMemberReference(record.member)]) {
				yield resolveReference(schema)(account)(record.member);
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
				'ProspectiveMembers'
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
					.groupBy(['memberID', 'accountID'])
			);

			for await (const record of accountEvents) {
				const memberID = record.memberID;

				foundMembers[stringifyMemberReference(memberID)] = true;

				yield memberID;
			}
		}

		const extraMemberCollection = schema.getCollection<StoredAccountMembership>(
			'ExtraAccountMembership'
		);

		const extraMembersGenerator = generateResults(
			findAndBind(extraMemberCollection, { accountID: account.id })
				.fields(['member'])
				.groupBy(['member'])
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
			: findAndBind(fileCollection, { accountID: account.id })
	);
};

export const getEvents = (schema: Schema) => (
	account: AccountObject
): AsyncIterator<EitherObj<ServerError, RawEventObject>> => {
	const eventCollection = schema.getCollection<RawEventObject>('Events');

	const find = eventCollection.find(`accountID = :accountID`).bind('accountID', account.id);

	return asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(find)
		)
	);
};

export const queryEvents = (query: string) => (schema: Schema) => (account: AccountObject) => (
	bind: any
) =>
	asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(queryEventsFind(query)(schema)(account)(bind))
		)
	);

export const queryEventsFind = (query: string) => (schema: Schema) => (account: AccountObject) => (
	bind: any
) => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const find = eventCollection
		.find(`accountID = :accountID AND (${query})`)
		.bind('accountID', account.id)
		.bind(bind);

	return find;
};

export const getEventsInRange = (schema: Schema) => (account: AccountObject) => (start: number) => (
	end: number
) => {
	const eventCollection = schema.getCollection<EventObject>('Events');

	const iterator = eventCollection
		.find(
			'accountID = :accountID AND ((pickupDateTime > :pickupDateTime AND pickupDateTime < :meetDateTime) OR (meetDateTime < :meetDateTime AND meetDateTime > :pickupDateTime))'
		)
		.bind('accountID', account.id)
		.bind('pickupDateTime', start)
		.bind('meetDateTime', end);

	return asyncIterHandler<RawEventObject>(errorGenerator('Could not get event for account'))(
		asyncIterMap(stripProp('_id') as (ev: RawEventObject) => RawEventObject)(
			generateResults(iterator)
		)
	);
};

export const saveAccount = (schema: Schema) => async (account: AccountObject) => {
	const collection = schema.getCollection<AccountObject>('Accounts');

	await collection.modify('id = :id').bind('id', account.id).patch(account).execute();
};

const getNormalTeamObjects = (schema: Schema) => (
	account: AccountObject
): ServerEither<AsyncIterableIterator<RawTeamObject>> =>
	asyncRight(
		schema.getCollection<RawTeamObject>('Teams'),
		errorGenerator('Could not get teams for account')
	)
		.map(
			findAndBindC<RawTeamObject>({
				accountID: account.id,
			})
		)
		.map(generateResults);

export const getTeamObjects = (schema: Schema) => (
	account: AccountObject
): ServerEither<AsyncIterableIterator<RawTeamObject>> =>
	account.type === AccountType.CAPSQUADRON
		? getStaffTeam(schema)(account).flatMap(team =>
				getNormalTeamObjects(schema)(account).map(objectIter =>
					asyncIterConcat(yieldObjAsync(Promise.resolve(team)))(() => objectIter)
				)
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
		errorGenerator('Could not get CAP Organization data')
	)
		.map(
			findAndBindC<NHQ.Organization>({
				ORGID,
			})
		)
		.map(collectResults)
		.map(Maybe.fromArray);

export const getOrgName = (accountGetter: Partial<AccountGetter>) => (schema: Schema) => (
	account: AccountObject
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
					errorGenerator('Could not get Accounts')
				)
					.map(onlyRights)
					.map(results =>
						results.filter(({ id }) => id === account.id).length === 1
							? [account]
							: results
					)
					.flatMap(results =>
						results.length === 1
							? registryByIdGetter(results[0].id)
									.map(get('Website'))
									.map(get('Name'))
									.map(Maybe.some)
							: orgInfoGetter(member.orgid).map(Maybe.map(get('Name')))
					);

			case 'CAPProspectiveMember':
				return registryByIdGetter(member.accountID)
					.map(get('Website'))
					.map(get('Name'))
					.map(Maybe.some);
		}
	};
};
