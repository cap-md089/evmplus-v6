/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { Schema } from '@mysql/xdevapi';
import {
	api,
	AccountObject,
	AsyncEither,
	asyncLeft,
	asyncRight,
	CadetPromotionStatus,
	CAPAccountObject,
	CAPExtraMemberInformation,
	CAPMember,
	CAPMemberObject,
	CAPMemberReference,
	CAPNHQMemberObject,
	CAPNHQMemberReference,
	CAPProspectiveMemberObject,
	Either,
	EitherObj,
	errorGenerator,
	get,
	getORGIDsFromCAPAccount,
	getFullMemberName,
	isPartOfTeam,
	iterFind,
	Maybe,
	MaybeObj,
	MemberForReference,
	memoize,
	NewCAPProspectiveMember,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	ServerError,
	ShortDutyPosition,
	Some,
	stringifyMemberReference,
	stripProp,
	TemporaryDutyPosition,
} from 'common-lib';
import { DateTime } from 'luxon';
import { AccountBackend } from '../../..';
import { BasicAccountRequest } from '../../../Account';
import { Backends, notImplementedError, notImplementedException } from '../../../backends';
import { MemberBackend } from '../../../Members';
import { collectResults, findAndBind, RawMySQLBackend } from '../../../MySQLUtil';
import { ServerEither } from '../../../servertypes';
import { TeamsBackend } from '../../../Team';
import {
	getBirthday,
	getCadetPromotionRequirements,
	getCAPNHQMembersForORGIDs,
	getExtraInformationFromCAPNHQMember,
	getNameForCAPNHQMember,
	getNHQMember,
	getNHQMemberAccount,
	getUnitPromotionRequirements,
} from './NHQMember';
import {
	createCAPProspectiveMember,
	deleteProspectiveMember,
	getExtraInformationFromProspectiveMember,
	getNameForCAPProspectiveMember,
	getProspectiveMember,
	getProspectiveMemberAccounts,
	getProspectiveMembersForAccount,
	upgradeProspectiveMemberToCAPNHQ,
} from './ProspectiveMember';

export { downloadCAPWATCHFile } from './NHQMember';

const invalidTypeLeft = asyncLeft<ServerError, any>({
	type: 'OTHER',
	message: 'Invalid member type',
	code: 400,
});

// -------------------------------------------------
//
// The following functions route specific general CAP stuff to more specific implementations for
// Prospective or NHQ members
//
// -------------------------------------------------

export const getExtraMemberInformationForCAPMember = (account: AccountObject) => (
	member: CAPMember,
): EitherObj<ServerError, CAPExtraMemberInformation> =>
	member.type === 'CAPNHQMember'
		? Either.right(getExtraInformationFromCAPNHQMember(account)(member))
		: member.type === 'CAPProspectiveMember'
		? Either.right(getExtraInformationFromProspectiveMember(account)(member))
		: Either.left({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });

export const resolveCAPReference = (schema: Schema) => (backends: Backends<[TeamsBackend]>) => (
	account: AccountObject,
) => <T extends CAPMemberReference = CAPMemberReference>(
	reference: T,
): AsyncEither<ServerError, MemberForReference<T>> =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	reference.type === 'CAPNHQMember' && typeof reference.id === 'number'
		? getNHQMember(schema)(backends)(account)(reference.id)
		: reference.type === 'CAPProspectiveMember' && typeof reference.id === 'string'
		? getProspectiveMember(schema)(backends)(account)(reference.id)
		: invalidTypeLeft;

export const getCAPMemberName = (schema: Schema) => (account: AccountObject) => (
	reference: CAPMemberReference,
): AsyncEither<ServerError, string> =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	reference.type === 'CAPNHQMember'
		? getNameForCAPNHQMember(schema)(reference)
		: reference.type === 'CAPProspectiveMember'
		? getNameForCAPProspectiveMember(schema)(account)(reference)
		: invalidTypeLeft;

export const getAccountsForMember = (backend: Backends<[AccountBackend]>) => (
	member: CAPMember,
): ServerEither<AccountObject[]> =>
	member.type === 'CAPNHQMember'
		? getNHQMemberAccount(backend)(member)
		: getProspectiveMemberAccounts(backend)(member);

interface CommanderInfo {
	commanderName: string;
	orgName: string;
}

const getCommanderName = Maybe.map<CommanderInfo, string>(get('commanderName'));
const getOrgName = Maybe.map<CommanderInfo, string>(get('orgName'));

export const getOrgInfo = (backend: Backends<[RawMySQLBackend]>) => (
	member: CAPNHQMemberObject,
): ServerEither<api.events.events.SquadronPOC> =>
	AsyncEither.All([
		asyncRight(
			backend.getCollection('NHQ_Commanders'),
			errorGenerator('Could not get unit commander name'),
		)
			.map(collection =>
				findAndBind(collection, {
					ORGID: member.orgid,
				}),
			)
			.map(collectResults)
			.map(commanders =>
				commanders.length === 1
					? Maybe.some({
							commanderName: getFullMemberName({
								memberRank: commanders[0].Rank,
								nameFirst: commanders[0].NameFirst,
								nameLast: commanders[0].NameLast,
								nameMiddle: commanders[0].NameMiddle,
								nameSuffix: commanders[0].NameSuffix,
							}),
							orgName: `${commanders[0].Wing}-${commanders[0].Unit}`,
					  })
					: Maybe.none(),
			),
		asyncRight(
			backend.getCollection('NHQ_OrgContact'),
			errorGenerator('Could not get unit contact information'),
		)
			.map(collection =>
				findAndBind(collection, {
					ORGID: member.orgid,
				}),
			)
			.map(collectResults)
			.map(contact => contact.map(({ Contact, Type }) => ({ contact: Contact, type: Type }))),
	]).map(([commanderInfo, contacts]) => ({
		commanderName: getCommanderName(commanderInfo),
		contacts,
		orgName: getOrgName(commanderInfo),
	}));

// -------------------------------------------------
//
// The following functions allow for manipulation of general CAP member data
//
// -------------------------------------------------

export const addTemporaryDutyPosition = (position: TemporaryDutyPosition) => (
	member: CAPMemberObject,
): CAPMemberObject => {
	const dutyPosition = iterFind<ShortDutyPosition>(({ duty }) => duty === position.Duty)(
		member.dutyPositions,
	);

	const dutyPositions = [...member.dutyPositions];

	if (!dutyPosition) {
		dutyPositions.push({
			date: position.assigned,
			duty: position.Duty,
			expires: position.validUntil,
			type: 'CAPUnit',
		});
	} else {
		if (dutyPosition.type === 'CAPUnit') {
			// eslint-disable-next-line @typescript-eslint/no-for-in-array
			for (const key in dutyPositions) {
				if (dutyPositions.hasOwnProperty(key)) {
					const oldDuty = dutyPositions[key];
					if (oldDuty.duty === dutyPosition.duty && oldDuty.type === 'CAPUnit') {
						oldDuty.expires = position.validUntil;
						oldDuty.date = position.assigned;
					}
				}
			}
		}
	}

	return {
		...member,
		dutyPositions,
	};
};

export const removeTemporaryDutyPosition = (duty: string) => (
	member: CAPMemberObject,
): CAPMemberObject => ({
	...member,
	dutyPositions: member.dutyPositions.filter(
		position => !(position.type === 'CAPUnit' && position.duty === duty),
	),
});

export const loadExtraCAPMemberInformation = (schema: Schema) => (
	backend: Backends<[TeamsBackend]>,
) => (account: AccountObject) => (
	memberID: CAPMemberReference,
): ServerEither<CAPExtraMemberInformation> =>
	asyncRight(
		schema.getCollection<CAPExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not load extra member information'),
	)
		.flatMap(collection =>
			AsyncEither.All([
				asyncRight(
					collectResults(
						findAndBind(collection, {
							member: memberID,
							accountID: account.id,
						}),
					),
					errorGenerator('Could not get extra member results'),
				),
				backend
					.getTeams(account)
					.map(teams => teams.filter(isPartOfTeam(memberID)).map(team => team.id)),
			]),
		)
		.map<CAPExtraMemberInformation>(([results, teams]) =>
			results.length === 1
				? { ...results[0], teamIDs: teams }
				: ({
						accountID: account.id,
						member: memberID,
						temporaryDutyPositions: [],
						flight: null,
						teamIDs: teams,
						absentee: null,
						type: 'CAP',
				  } as CAPExtraMemberInformation),
		)
		.map(stripProp('_id'))
		.map(results => ({
			...results,
			temporaryDutyPositions: results.temporaryDutyPositions.filter(
				v => v.validUntil > Date.now(),
			),
		}));

const eventTagsSql = (schema: Schema): string => /* sql */ `\
SELECT
	E.doc ->> '$.requirementTag' as Tag
FROM
	${schema.getName()}.NHQ_Member as M
LEFT JOIN
	${schema.getName()}.Attendance as A
ON
	A.capID = M.CAPID
LEFT JOIN
	${schema.getName()}.Events as E
ON
	E.id = A.eventID
AND
	E.accountID = A.accountID
WHERE
	M.CAPID = ?
AND
	A.doc ->> '$.status' = 'CommittedAttended'
AND
	A.accountID = ?
GROUP BY
	Tag;`;

export const memberEventTags = (backend: Backends<[RawMySQLBackend]>) => (accountID: string) => (
	memberReference: CAPNHQMemberReference,
): ServerEither<string[]> =>
	asyncRight(
		backend.getSchema().getSession(),
		errorGenerator('Could not get current member requirement tags'),
	)
		.map(session =>
			session
				.sql(eventTagsSql(backend.getSchema()))
				.bind([memberReference.id, accountID])
				.execute(),
		)
		.map(result =>
			result
				.fetchAll()
				.map(([value]: [string]) => value)
				.filter(value => !!value && value !== 'null'),
		);

export interface CAPMemberBackend {
	deleteProspectiveMember: (member: RawCAPProspectiveMemberObject) => ServerEither<void>;
	createProspectiveMember: (
		account: RawCAPSquadronAccountObject,
	) => (member: NewCAPProspectiveMember) => ServerEither<CAPProspectiveMemberObject>;
	getAccountsForMember: (member: CAPMember) => ServerEither<AccountObject[]>;
	getNHQMembersInAccount: (
		backend: Backends<[TeamsBackend]>,
	) => (account: CAPAccountObject) => ServerEither<MaybeObj<CAPNHQMemberObject[]>>;
	getProspectiveMembersInAccount: (
		backend: Backends<[TeamsBackend]>,
	) => (account: RawCAPSquadronAccountObject) => ServerEither<CAPProspectiveMemberObject[]>;
	upgradeProspectiveMember: (
		backend: MemberBackend,
	) => (
		member: CAPProspectiveMemberObject,
	) => (newMember: CAPNHQMemberReference) => ServerEither<void>;
	getBirthday: (member: CAPMember) => ServerEither<DateTime>;
	getPromotionRequirements: (member: CAPNHQMemberObject) => ServerEither<CadetPromotionStatus>;
	getAccountPromotionRequirements: (
		account: RawCAPSquadronAccountObject,
	) => ServerEither<{ [CAPID: number]: CadetPromotionStatus }>;
	getOrgInfo: (member: CAPNHQMemberObject) => ServerEither<api.events.events.SquadronPOC>;
	getMemberEventTags: (
		accountID: string,
	) => (memberReference: CAPNHQMemberReference) => ServerEither<string[]>;
}

export const getCAPMemberBackend = (req: BasicAccountRequest): CAPMemberBackend =>
	getRequestFreeCAPMemberBackend(req.mysqlx, req.backend);

export const getRequestFreeCAPMemberBackend = (
	mysqlx: Schema,
	prevBackends: Backends<[AccountBackend, RawMySQLBackend]>,
): CAPMemberBackend => ({
	deleteProspectiveMember: deleteProspectiveMember(mysqlx),
	createProspectiveMember: account => member =>
		createCAPProspectiveMember(mysqlx)(account)(member),
	getAccountsForMember: memoize(getAccountsForMember(prevBackends), stringifyMemberReference),
	getNHQMembersInAccount: memoize(prevBackend =>
		memoize(
			account =>
				prevBackend
					.getTeams(account)
					.flatMap(teams =>
						Maybe.isSome(getORGIDsFromCAPAccount(account))
							? getCAPNHQMembersForORGIDs(mysqlx)(account.id)(teams)(
									(getORGIDsFromCAPAccount(account) as Some<number[]>).value,
							  ).map(Maybe.some)
							: asyncRight(Maybe.none(), errorGenerator('Could not get members')),
					),
			get('id'),
		),
	),
	getProspectiveMembersInAccount: memoize(backend =>
		memoize(getProspectiveMembersForAccount(mysqlx)(backend), get('id')),
	),
	upgradeProspectiveMember: backend =>
		upgradeProspectiveMemberToCAPNHQ({ ...backend, ...prevBackends }),
	getBirthday: memoize(getBirthday(mysqlx), stringifyMemberReference),
	getPromotionRequirements: memoize(
		getCadetPromotionRequirements(mysqlx),
		stringifyMemberReference,
	),
	getOrgInfo: memoize(getOrgInfo(prevBackends), ({ orgid }) => orgid),
	getMemberEventTags: memberEventTags(prevBackends),
	getAccountPromotionRequirements: getUnitPromotionRequirements(mysqlx),
});

export const getEmptyCAPMemberBackend = (): CAPMemberBackend => ({
	deleteProspectiveMember: () => notImplementedError('deleteProspectiveMember'),
	createProspectiveMember: () => () => notImplementedError('createProspectiveMember'),
	getAccountsForMember: () => notImplementedException('getAccountsForMember'),
	getNHQMembersInAccount: () => () => notImplementedError('getNHQMembersInAccount'),
	getProspectiveMembersInAccount: () => () =>
		notImplementedError('getProspectiveMembersInAccount'),
	upgradeProspectiveMember: () => () => () => notImplementedError('upgradeProspectiveMember'),
	getBirthday: () => notImplementedError('getBirthday'),
	getPromotionRequirements: () => notImplementedError('getPromotionRequirements'),
	getOrgInfo: () => notImplementedError('getOrgInfo'),
	getMemberEventTags: () => () => notImplementedError('getMemberEventTags'),
	getAccountPromotionRequirements: () => notImplementedError('getAccountPromotionRequirements'),
});
