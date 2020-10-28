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

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AccountType,
	addOne,
	AsyncEither,
	AsyncIter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	CAPAccountObject,
	CAPExtraMemberInformation,
	CAPNHQMemberObject,
	CAPProspectiveMemberObject,
	CAPProspectiveMemberReference,
	Either,
	EitherObj,
	errorGenerator,
	get,
	getMemberName,
	getUserID,
	isRegularCAPAccountObject,
	NewCAPProspectiveMember,
	RawCAPEventAccountObject,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	RawTeamObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	StoredProspectiveMemberObject,
	stripProp,
	yieldObjAsync,
	CAPNHQMemberReference,
	always,
	destroy,
	asyncIterReduce,
} from 'common-lib';
import { loadExtraCAPMemberInformation } from '.';
import { CAP } from '..';
import { AccountGetter } from '../../../Account';
import {
	addToCollection,
	collectResults,
	deleteFromCollectionA,
	findAndBindC,
	addItemToCollection,
	generateResults,
} from '../../../MySQLUtil';
import { getRegistry } from '../../../Registry';
import { getNameForCAPNHQMember } from './NHQMember';

const getRowsForProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	reference: CAPProspectiveMemberReference,
): AsyncEither<ServerError, StoredProspectiveMemberObject> =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not get member information'),
	)
		.map(
			findAndBindC<StoredProspectiveMemberObject>({
				id: reference.id,
				accountID: account.id,
			}),
		)
		.map(collectResults)
		.filter(results => results.length === 1, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(get(0))
		.map(obj => stripProp('_id')(obj) as StoredProspectiveMemberObject);

export const expandProspectiveMember = (schema: Schema) => (
	account: Exclude<CAPAccountObject, RawCAPEventAccountObject>,
) => (teamObjects?: RawTeamObject[]) => (info: RawCAPProspectiveMemberObject) =>
	getRegistry(schema)(account).flatMap(registry =>
		asyncRight(info.id, errorGenerator('Could not get member information'))
			.flatMap(id =>
				AsyncEither.All([
					loadExtraCAPMemberInformation(schema)(account)({
						id,
						type: 'CAPProspectiveMember',
					})(teamObjects),
				]),
			)
			.map<CAPProspectiveMemberObject>(([extraInformation]) => ({
				absenteeInformation: extraInformation.absentee,
				contact: info.contact,
				dutyPositions: extraInformation.temporaryDutyPositions.map(
					item =>
						({
							date: item.assigned,
							duty: item.Duty,
							expires: item.validUntil,
							type: 'CAPUnit',
						} as ShortDutyPosition),
				),
				flight: extraInformation.flight,
				id: info.id,
				memberRank: info.memberRank,
				nameFirst: info.nameFirst,
				nameLast: info.nameLast,
				nameMiddle: info.nameMiddle,
				nameSuffix: info.nameSuffix,
				hasNHQReference: false,
				seniorMember: info.seniorMember,
				squadron: registry.Website.Name,
				type: 'CAPProspectiveMember',
				orgid: account.type === AccountType.CAPSQUADRON ? account.mainOrg : account.orgid,
				accountID: account.id,
				usrID: info.usrID,
				teamIDs: extraInformation.teamIDs,
			})),
	);

export const getProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	teamObjects?: RawTeamObject[],
) => (
	prospectiveID: string,
): AsyncEither<ServerError, CAPProspectiveMemberObject | CAPNHQMemberObject> =>
	getRegistry(schema)(account).flatMap(registry =>
		isRegularCAPAccountObject(account)
			? asyncRight(prospectiveID, errorGenerator('Could not get member information'))
					.flatMap(id =>
						AsyncEither.All([
							getRowsForProspectiveMember(schema)(account)({
								type: 'CAPProspectiveMember',
								id,
							}),
							loadExtraCAPMemberInformation(schema)(account)({
								id,
								type: 'CAPProspectiveMember',
							})(teamObjects),
						]),
					)
					.flatMap<CAPProspectiveMemberObject | CAPNHQMemberObject>(
						([info, extraInformation]) =>
							info.hasNHQReference
								? CAP.resolveCAPReference(schema)(account)(info.nhqReference)
								: asyncRight(
										{
											absenteeInformation: extraInformation.absentee,
											contact: info.contact,
											dutyPositions: [
												...extraInformation.temporaryDutyPositions.map(
													item =>
														({
															date: item.assigned,
															duty: item.Duty,
															expires: item.validUntil,
															type: 'CAPUnit',
														} as ShortDutyPosition),
												),
											],
											flight: extraInformation.flight,
											id: info.id,
											memberRank: info.memberRank,
											nameFirst: info.nameFirst,
											nameLast: info.nameLast,
											nameMiddle: info.nameMiddle,
											nameSuffix: info.nameSuffix,
											seniorMember: info.seniorMember,
											hasNHQReference: false,
											squadron: registry.Website.Name,
											type: 'CAPProspectiveMember',
											orgid:
												account.type === AccountType.CAPSQUADRON
													? account.mainOrg
													: account.orgid,
											accountID: account.id,
											usrID: info.usrID,
											teamIDs: extraInformation.teamIDs,
										},
										errorGenerator(
											'Could not get prospective member information',
										),
								  ),
					)
			: asyncLeft({
					type: 'OTHER',
					code: 400,
					message: 'Cannot create a prospective member for a CAP Event account',
			  }),
	);

export const getExtraInformationFromProspectiveMember = (account: AccountObject) => (
	member: CAPProspectiveMemberObject,
): CAPExtraMemberInformation => ({
	absentee: member.absenteeInformation,
	accountID: account.id,
	flight: member.flight,
	member: {
		type: 'CAPProspectiveMember',
		id: member.id,
	},
	teamIDs: [],
	temporaryDutyPositions: member.dutyPositions
		.filter((v): v is ShortCAPUnitDutyPosition => v.type === 'CAPUnit')
		.map(({ date, duty, expires }) => ({
			Duty: duty,
			assigned: date,
			validUntil: expires,
		})),
});

export const getNameForCAPProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	reference: CAPProspectiveMemberReference,
): AsyncEither<ServerError, string> =>
	getRowsForProspectiveMember(schema)(account)(reference).flatMap(result =>
		result.hasNHQReference
			? getNameForCAPNHQMember(schema)(result.nhqReference)
			: asyncRight(
					`${result.memberRank} ${getMemberName({
						nameFirst: result.nameFirst,
						nameMiddle: result.nameMiddle,
						nameLast: result.nameLast,
						nameSuffix: result.nameSuffix,
					})}`,
					errorGenerator('Could not get prospective member name'),
			  ),
	);

export const createCAPProspectiveMember = (schema: Schema) => (
	account: RawCAPSquadronAccountObject,
) => (data: NewCAPProspectiveMember): AsyncEither<ServerError, CAPProspectiveMemberObject> =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not create member'),
	).flatMap(collection =>
		asyncRight(
			findAndBindC<StoredProspectiveMemberObject>({
				accountID: account.id,
			})(collection),
			errorGenerator('Could not get member ID'),
		)
			.map(generateResults)
			.map(
				asyncIterReduce((prev: number, curr: StoredProspectiveMemberObject) =>
					Math.max(prev, parseInt(curr.id.split('-')[1], 10)),
				)(1),
			)
			.map(addOne)
			.map(id => `${account.id}-${id}`)
			.flatMap(id =>
				getRegistry(schema)(account).map<RawCAPProspectiveMemberObject>(registry => ({
					...data,
					id,
					absenteeInformation: null,
					accountID: account.id,
					dutyPositions: [],
					hasNHQReference: false,
					memberRank: data.seniorMember ? 'SM' : 'CADET',
					orgid: account.mainOrg,
					squadron: registry.Website.Name,
					type: 'CAPProspectiveMember',
					usrID: getUserID([data.nameFirst, data.nameMiddle, data.nameLast]),
				})),
			)
			.flatMap(
				addToCollection(
					schema.getCollection<RawCAPProspectiveMemberObject>('ProspectiveMembers'),
				),
			)
			.flatMap(expandProspectiveMember(schema)(account)([])),
	);

export const getProspectiveMemberAccountsFunc = (accountGetter: AccountGetter) => (
	schema: Schema,
) => (member: CAPProspectiveMemberObject): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterMap<EitherObj<ServerError, AccountObject>, EitherObj<ServerError, AccountObject>>(
		Either.map(stripProp('_id') as (obj: AccountObject) => AccountObject),
	)(yieldObjAsync(accountGetter.byId(schema)(member.accountID)));

export const deleteProspectiveMember = (schema: Schema) => (member: CAPProspectiveMemberObject) =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not delete prospective member'),
	).flatMap(deleteFromCollectionA(member));

export const upgradeProspectiveMemberToCAPNHQ = (schema: Schema) => (
	member: CAPProspectiveMemberObject,
) => (nhqReference: CAPNHQMemberReference) =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not delete prospective member'),
	)
		.flatMap(collection =>
			deleteFromCollectionA(member as StoredProspectiveMemberObject)(collection).map(
				always(collection),
			),
		)
		.flatMap(
			addItemToCollection({
				hasNHQReference: true,
				accountID: member.accountID,
				id: member.id,
				nhqReference,
				type: 'CAPProspectiveMember',
			} as StoredProspectiveMemberObject),
		)
		.map(destroy);
