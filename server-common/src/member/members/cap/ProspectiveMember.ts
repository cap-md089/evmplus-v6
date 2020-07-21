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
	CAPProspectiveMemberObject,
	CAPProspectiveMemberReference,
	Either,
	EitherObj,
	errorGenerator,
	get,
	getMemberName,
	getUserID,
	isRegularCAPAccountObject,
	maxAsync,
	NewCAPProspectiveMember,
	RawCAPEventAccountObject,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	RawTeamObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	stripProp,
	yieldObjAsync,
} from 'common-lib';
import { loadExtraCAPMemberInformation } from '.';
import { AccountGetter } from '../../../Account';
import { collectResults, findAndBindC, generateResults } from '../../../MySQLUtil';
import { getRegistry } from '../../../Registry';

const getRowsForProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	reference: CAPProspectiveMemberReference
) =>
	asyncRight(
		schema.getCollection<RawCAPProspectiveMemberObject>('ProspecitveMembers'),
		errorGenerator('Could not get member information')
	)
		.map(
			findAndBindC<RawCAPProspectiveMemberObject>({
				id: reference.id,
				accountID: account.id,
			})
		)
		.map(collectResults)
		.filter(results => results.length === 1, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(get(0))
		.map(stripProp('_id'));

export const expandProspectiveMember = (schema: Schema) => (
	account: Exclude<CAPAccountObject, RawCAPEventAccountObject>
) => (teamObjects?: RawTeamObject[]) => (info: RawCAPProspectiveMemberObject) =>
	getRegistry(schema)(account).flatMap(registry =>
		asyncRight(info.id, errorGenerator('Could not get member information'))
			.flatMap(id =>
				AsyncEither.All([
					loadExtraCAPMemberInformation(schema)(account)({
						id,
						type: 'CAPProspectiveMember',
					})(teamObjects),
				])
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
						} as ShortDutyPosition)
				),
				flight: extraInformation.flight,
				id: info.id,
				memberRank: info.memberRank,
				nameFirst: info.nameFirst,
				nameLast: info.nameLast,
				nameMiddle: info.nameMiddle,
				nameSuffix: info.nameSuffix,
				seniorMember: info.seniorMember,
				squadron: registry.Website.Name,
				type: 'CAPProspectiveMember',
				orgid: account.type === AccountType.CAPSQUADRON ? account.mainOrg : account.orgid,
				accountID: account.id,
				usrID: info.usrID,
				teamIDs: extraInformation.teamIDs,
			}))
	);

export const getProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	teamObjects?: RawTeamObject[]
) => (prospectiveID: string): AsyncEither<ServerError, CAPProspectiveMemberObject> =>
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
						])
					)
					.map<CAPProspectiveMemberObject>(([info, extraInformation]) => ({
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
									} as ShortDutyPosition)
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
						squadron: registry.Website.Name,
						type: 'CAPProspectiveMember',
						orgid:
							account.type === AccountType.CAPSQUADRON
								? account.mainOrg
								: account.orgid,
						accountID: account.id,
						usrID: info.usrID,
						teamIDs: extraInformation.teamIDs,
					}))
			: asyncLeft({
					type: 'OTHER',
					code: 400,
					message: 'Cannot create a prospective member for a CAP Event account',
			  })
	);

export const getExtraInformationFromProspectiveMember = (account: AccountObject) => (
	member: CAPProspectiveMemberObject
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
	reference: CAPProspectiveMemberReference
): AsyncEither<ServerError, string> =>
	getRowsForProspectiveMember(schema)(account)(reference).map(
		result =>
			`${result.memberRank} ${getMemberName({
				nameFirst: result.nameFirst,
				nameMiddle: result.nameMiddle,
				nameLast: result.nameLast,
				nameSuffix: result.nameSuffix,
			})}`
	);

export const createCAPProspectiveMember = (schema: Schema) => (
	account: RawCAPSquadronAccountObject
) => (data: NewCAPProspectiveMember): AsyncEither<ServerError, CAPProspectiveMemberObject> =>
	asyncRight(
		schema.getCollection<RawCAPProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not create member')
	).flatMap(collection =>
		asyncRight(
			findAndBindC<RawCAPProspectiveMemberObject>({
				accountID: account.id,
			})(collection),
			errorGenerator('Could not get member ID')
		)
			.map(generateResults)
			.map(asyncIterMap(get('id')))
			.map(asyncIterMap(id => parseInt((id.match(/(0-9])*$/) || [])[1], 10)))
			.map(maxAsync)
			.map(addOne)
			.map(id => `${account.id}-${id}`)
			.flatMap(id =>
				getRegistry(schema)(account).flatMap(registry =>
					asyncRight(
						collection.add({
							...data,
							id,
							accountID: account.id,
							type: 'CAPProspectiveMember',
							absenteeInformation: null,
							dutyPositions: [],
							memberRank: data.seniorMember ? 'SM' : 'CADET',
							orgid: account.mainOrg,
							squadron: registry.Website.Name,
							usrID: getUserID([data.nameFirst, data.nameMiddle, data.nameLast]),
						}),
						errorGenerator('Could not add member')
					).map<CAPProspectiveMemberObject>(() => ({
						...data,
						id,
						accountID: account.id,
						type: 'CAPProspectiveMember',
						squadron: registry.Website.Name,
						absenteeInformation: null,
						teamIDs: [],
						dutyPositions: [],
						memberRank: data.seniorMember ? 'SM' : 'CADET',
						orgid: account.mainOrg,
						usrID: getUserID([data.nameFirst, data.nameMiddle, data.nameLast]),
					}))
				)
			)
	);

export const getProspectiveMemberAccountsFunc = (accountGetter: AccountGetter) => (
	schema: Schema
) => (member: CAPProspectiveMemberObject): AsyncIter<EitherObj<ServerError, AccountObject>> =>
	asyncIterMap<EitherObj<ServerError, AccountObject>, EitherObj<ServerError, AccountObject>>(
		Either.map(stripProp('_id') as (obj: AccountObject) => AccountObject)
	)(yieldObjAsync(accountGetter.byId(schema)(member.accountID)));
