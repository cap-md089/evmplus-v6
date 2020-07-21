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
	AccountObject,
	AsyncEither,
	asyncLeft,
	asyncRight,
	CAPExtraMemberInformation,
	CAPMember,
	CAPMemberObject,
	CAPMemberReference,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	isPartOfTeam,
	iterFind,
	MemberForReference,
	RawTeamObject,
	ServerError,
	ShortDutyPosition,
	stripProp,
	TemporaryDutyPosition,
	asyncIterFilter,
	asyncIterMap,
	get,
} from 'common-lib';
import {
	getAccount,
	getTeamObjects,
	AccountGetter,
	getCAPAccountsForORGID,
} from '../../../Account';
import { collectResults, findAndBind } from '../../../MySQLUtil';
import { ServerEither } from '../../../servertypes';
import {
	getExtraInformationFromCAPNHQMember,
	getNameForCAPNHQMember,
	getNHQHomeAccountsFunc,
	getNHQMember,
} from './NHQMember';
import {
	getExtraInformationFromProspectiveMember,
	getNameForCAPProspectiveMember,
	getProspectiveMember,
	getProspectiveMemberAccountsFunc,
} from './ProspectiveMember';

export * from './NHQMember';
export * from './ProspectiveMember';

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
	member: CAPMember
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

export const resolveCAPReference = (schema: Schema) => (account: AccountObject) => <
	T extends CAPMemberReference = CAPMemberReference
>(
	reference: T
): AsyncEither<ServerError, MemberForReference<T>> =>
	reference.type === 'CAPNHQMember' && typeof reference.id === 'number'
		? getNHQMember(schema)(account)()(reference.id)
		: reference.type === 'CAPProspectiveMember' && typeof reference.id === 'string'
		? getProspectiveMember(schema)(account)()(reference.id)
		: invalidTypeLeft;

export const getCAPMemberName = (schema: Schema) => (account: AccountObject) => (
	reference: CAPMemberReference
): AsyncEither<ServerError, string> =>
	reference.type === 'CAPNHQMember'
		? getNameForCAPNHQMember(schema)(reference)
		: reference.type === 'CAPProspectiveMember'
		? getNameForCAPProspectiveMember(schema)(account)(reference)
		: invalidTypeLeft;

export const getHomeAccountsForMember = (accountGetter: Partial<AccountGetter>) => (
	schema: Schema
) => (member: CAPMember) =>
	member.type === 'CAPNHQMember'
		? getNHQHomeAccountsFunc({
				byId: getAccount,
				byOrgid: getCAPAccountsForORGID,
				...accountGetter,
		  })(schema)(member)
		: getProspectiveMemberAccountsFunc({
				byId: getAccount,
				byOrgid: getCAPAccountsForORGID,
				...accountGetter,
		  })(schema)(member);

// -------------------------------------------------
//
// The following functions allow for manipulation of general CAP member data
//
// -------------------------------------------------

export const addTemporaryDutyPosition = (position: TemporaryDutyPosition) => (
	member: CAPMemberObject
): CAPMemberObject => {
	const dutyPosition = iterFind<ShortDutyPosition>(({ duty }) => duty === position.Duty)(
		member.dutyPositions
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
	member: CAPMemberObject
): CAPMemberObject => ({
	...member,
	dutyPositions: member.dutyPositions.filter(
		position => !(position.type === 'CAPUnit' && position.duty === duty)
	),
});

const getTeamIDs = (schema: Schema) => (account: AccountObject) => (memberID: CAPMemberReference) =>
	getTeamObjects(schema)(account)
		.map(asyncIterFilter<RawTeamObject>(isPartOfTeam(memberID)))
		.map(asyncIterMap<RawTeamObject, number>(get('id')))
		.map(collectGeneratorAsync);

export const loadExtraCAPMemberInformation = (schema: Schema) => (account: AccountObject) => (
	memberID: CAPMemberReference
) => (teamObjects?: RawTeamObject[]): ServerEither<CAPExtraMemberInformation> =>
	asyncRight(
		schema.getCollection<CAPExtraMemberInformation>('ExtraMemberInformation'),
		errorGenerator('Could not load extra member information')
	)
		.flatMap(collection =>
			AsyncEither.All([
				asyncRight(
					collectResults(
						findAndBind(collection, {
							member: memberID,
							accountID: account.id,
						})
					),
					errorGenerator('Could not get extra member results')
				),
				teamObjects
					? asyncRight(
							teamObjects.filter(isPartOfTeam(memberID)).map(obj => obj.id),
							errorGenerator('Could not get Team IDs')
					  )
					: getTeamIDs(schema)(account)(memberID),
			])
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
				  } as CAPExtraMemberInformation)
		)
		.map(stripProp('_id'))
		.map(results => ({
			...results,
			temporaryDutyPositions: results.temporaryDutyPositions.filter(
				v => v.validUntil > Date.now()
			),
		}));
