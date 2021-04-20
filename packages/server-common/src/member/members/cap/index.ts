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
	AccountObject,
	AsyncEither,
	asyncLeft,
	asyncRight,
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
	getCAPNHQMembersForORGIDs,
	getExtraInformationFromCAPNHQMember,
	getNameForCAPNHQMember,
	getNHQMember,
	getNHQMemberAccount,
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
	reference.type === 'CAPNHQMember' && typeof reference.id === 'number'
		? getNHQMember(schema)(backends)(account)(reference.id)
		: reference.type === 'CAPProspectiveMember' && typeof reference.id === 'string'
		? getProspectiveMember(schema)(backends)(account)(reference.id)
		: invalidTypeLeft;

export const getCAPMemberName = (schema: Schema) => (account: AccountObject) => (
	reference: CAPMemberReference,
): AsyncEither<ServerError, string> =>
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
});
