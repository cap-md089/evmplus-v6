/**
 *
 * Copyright (C) 2021 Andrew Rioux
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
import type { ServerEither } from 'auto-client-api';
import {
	AccountObject,
	addOne,
	always,
	areMembersTheSame,
	AsyncEither,
	asyncIterReduce,
	asyncLeft,
	asyncRight,
	CAPAccountObject,
	CAPExternalMemberObject,
	CAPExternalMemberReference,
	CAPExtraMemberInformation,
	destroy,
	errorGenerator,
	get,
	getMemberName,
	getORGIDsFromRegularCAPAccount,
	getUserID,
	isPartOfTeam,
	isRegularCAPAccountObject,
	Maybe,
	MemberReference,
	NewCAPExternalMemberObject,
	RawCAPExternalMemberObject,
	RegularCAPAccountObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	stripProp,
	toReference,
} from 'common-lib';
import { loadExtraCAPMemberInformation } from '.';
import { AccountBackend } from '../../../Account';
import { Backends, TimeBackend } from '../../../backends';
import {
	addToCollection,
	collectResults,
	deleteFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	modifyAndBindC,
	RawMySQLBackend,
} from '../../../MySQLUtil';
import { RegistryBackend } from '../../../Registry';
import { getEmptyTeamsBackend, TeamsBackend } from '../../../Team';

const getRowsForExternalMember = (schema: Schema) => (account: CAPAccountObject) => (
	reference: CAPExternalMemberReference,
): AsyncEither<ServerError, RawCAPExternalMemberObject> =>
	asyncRight(
		schema.getCollection<RawCAPExternalMemberObject>('ExternalMembers'),
		errorGenerator('Could not get member information'),
	)
		.map(
			findAndBindC<RawCAPExternalMemberObject>({
				id: reference.id,
				accountID: account.id,
			}),
		)
		.map(collectResults)
		.filter(results => results.length === 1 && results[0].approved.hasValue, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(get(0))
		.map(stripProp('_id'));

export const getExternalMembersForAccount = (schema: Schema) => (
	backend: Backends<[RegistryBackend, TeamsBackend]>,
) => (account: AccountObject): ServerEither<CAPExternalMemberObject[]> =>
	isRegularCAPAccountObject(account)
		? AsyncEither.All([
				backend.getRegistry(account),
				asyncRight(
					collectResults(
						findAndBind(
							schema.getCollection<RawCAPExternalMemberObject>('ExternalMembers'),
							{
								accountID: account.id,
							},
						),
					),
					errorGenerator('Could not get external members for account'),
				),
				asyncRight(
					collectResults(
						findAndBind(
							schema.getCollection<CAPExtraMemberInformation>('ExternalMembers'),
							{
								accountID: account.id,
							},
						),
					),
					errorGenerator('Could not load external members for account'),
				),
				backend.getTeams(account),
		  ]).map(([registry, members, orgExtraInfo, teamObjects]) =>
				members
					.map(member => {
						const memberID = toReference(member);
						const finder = areMembersTheSame(member);

						const extraInfo =
							orgExtraInfo.find(({ member: id }) => finder(id)) ??
							({
								accountID: account.id,
								member: memberID,
								temporaryDutyPositions: [],
								flight: null,
								teamIDs: teamObjects
									.filter(isPartOfTeam(memberID))
									.map(({ id }) => id),
								absentee: null,
								type: 'CAP',
							} as CAPExtraMemberInformation);

						return {
							absenteeInformation: extraInfo.absentee,
							contact: member.contact,
							dutyPositions: extraInfo.temporaryDutyPositions.map(
								item =>
									({
										date: item.assigned,
										duty: item.Duty,
										expires: item.validUntil,
										type: 'CAPUnit',
									} as ShortDutyPosition),
							),
							flight: extraInfo.flight,
							id: member.id,
							memberRank: member.memberRank,
							nameFirst: member.nameFirst,
							nameLast: member.nameLast,
							nameMiddle: member.nameMiddle,
							nameSuffix: member.nameSuffix,
							hasNHQReference: false as const,
							seniorMember: member.seniorMember,
							squadron: registry.Website.Name,
							type: 'CAPExternalMember' as const,
							orgid: getORGIDsFromRegularCAPAccount(account)[0],
							accountID: account.id,
							usrID: member.usrID,
							teamIDs: extraInfo.teamIDs,
							approved: member.approved,
							capid: member.capid,
							expiry: member.expiry,
						};
					})
					.filter(({ approved }) => Maybe.isSome(approved)),
		  )
		: asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot get external members for an event account',
		  });

export const expandExternalMember = (
	backends: Backends<[RawMySQLBackend, RegistryBackend, TeamsBackend]>,
) => (account: RegularCAPAccountObject) => (
	info: RawCAPExternalMemberObject,
): ServerEither<CAPExternalMemberObject> =>
	backends.getRegistry(account).flatMap(registry =>
		asyncRight(info.id, errorGenerator('Could not get member information'))
			.flatMap(id =>
				loadExtraCAPMemberInformation(backends.getSchema())(backends)(account)({
					id,
					type: 'CAPExternalMember',
				}),
			)
			.map<CAPExternalMemberObject>(extraInformation => ({
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
				type: 'CAPExternalMember',
				orgid: getORGIDsFromRegularCAPAccount(account)[0],
				accountID: account.id,
				usrID: info.usrID,
				teamIDs: extraInformation.teamIDs,
				expiry: info.expiry,
				approved: info.approved,
				capid: info.capid,
			})),
	);

export const getExternalMember = (schema: Schema) => (
	backends: Backends<[RegistryBackend, TeamsBackend]>,
) => (account: AccountObject) => (
	externalID: string,
): AsyncEither<ServerError, CAPExternalMemberObject> =>
	backends.getRegistry(account).flatMap(registry =>
		isRegularCAPAccountObject(account)
			? asyncRight(externalID, errorGenerator('Could not get member information'))
					.flatMap(id =>
						AsyncEither.All([
							getRowsForExternalMember(schema)(account)({
								type: 'CAPExternalMember',
								id,
							}),
							loadExtraCAPMemberInformation(schema)(backends)(account)({
								type: 'CAPExternalMember',
								id,
							}),
						]),
					)
					.map<CAPExternalMemberObject>(([info, extraInformation]) => ({
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
						type: 'CAPExternalMember',
						orgid: getORGIDsFromRegularCAPAccount(account)[0],
						accountID: account.id,
						usrID: info.usrID,
						teamIDs: extraInformation.teamIDs,
						approved: info.approved,
						capid: info.capid,
						expiry: info.expiry,
					}))
			: asyncLeft({
					type: 'OTHER',
					code: 400,
					message: 'Cannot get an external member for a CAP event account',
			  }),
	);

export const getExternalMemberAccounts = (backend: Backends<[AccountBackend]>) => (
	member: CAPExternalMemberObject,
): ServerEither<CAPAccountObject[]> =>
	backend.getAccount(member.accountID).map(account => [account]);

export const getExtraInformationFromExternalMember = (account: AccountObject) => (
	member: CAPExternalMemberObject,
): CAPExtraMemberInformation => ({
	absentee: member.absenteeInformation,
	accountID: account.id,
	flight: member.flight,
	member: {
		type: 'CAPExternalMember',
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
	type: 'CAP',
});

export const getNameForCAPExternalMember = (schema: Schema) => (account: CAPAccountObject) => (
	reference: CAPExternalMemberReference,
): AsyncEither<ServerError, string> =>
	getRowsForExternalMember(schema)(account)(reference).map(
		result =>
			`${result.memberRank} ${getMemberName({
				nameFirst: result.nameFirst,
				nameMiddle: result.nameMiddle,
				nameLast: result.nameLast,
				nameSuffix: result.nameSuffix,
			})}`,
	);

export const createExternalMember = (backends: Backends<[RawMySQLBackend, RegistryBackend]>) => (
	account: RegularCAPAccountObject,
) => (data: NewCAPExternalMemberObject): AsyncEither<ServerError, CAPExternalMemberObject> =>
	asyncRight(
		backends.getSchema().getSession().startTransaction(),
		errorGenerator('Could not create external member'),
	).flatMap(() =>
		asyncRight(
			backends.getCollection('ExternalMembers'),
			errorGenerator('Could not create member'),
		).flatMap(collection =>
			asyncRight(
				findAndBind(collection, { accountID: account.id }),
				errorGenerator('Could not get previous members'),
			)
				.map(generateResults)
				.map(
					asyncIterReduce((prev: number, curr: RawCAPExternalMemberObject) =>
						Math.max(prev, parseInt(curr.id.split('-')[1], 10)),
					)(1),
				)
				.map(addOne)
				.map(id => `${account.id}-${id}`)
				.flatMap(id =>
					backends.getRegistry(account).map<RawCAPExternalMemberObject>(registry => ({
						...data,
						approved: Maybe.none(),
						id,
						absenteeInformation: null,
						accountID: account.id,
						dutyPositions: [],
						hasNHQReference: false,
						memberRank: data.memberRank,
						orgid: getORGIDsFromRegularCAPAccount(account)[0],
						squadron: registry.Website.Name,
						type: 'CAPExternalMember',
						usrID: getUserID([data.nameFirst, data.nameMiddle, data.nameLast]),
					})),
				)
				.flatMap(addToCollection(backends.getCollection('ExternalMembers')))
				.flatMap(
					expandExternalMember({
						...backends,
						...getEmptyTeamsBackend(),
						getTeams: () => asyncRight([], errorGenerator('wut?')),
					})(account),
				)
				.flatMap(member =>
					asyncRight(
						backends.getSchema().getSession().commit(),
						errorGenerator('Could not save changes'),
					).map(always(member)),
				),
		),
	);

export const deleteExternalMember = (backends: Backends<[RawMySQLBackend]>) => (
	member: RawCAPExternalMemberObject,
): ServerEither<void> =>
	asyncRight(
		backends.getCollection('ExternalMembers'),
		errorGenerator('Could not delete prospective member'),
	)
		.flatMap(deleteFromCollectionA(toReference(member)))
		.map(destroy);

export const approveExternalMember = (backends: Backends<[RawMySQLBackend, TimeBackend]>) => (
	approver: MemberReference,
) => (member: CAPExternalMemberReference): ServerEither<void> =>
	asyncRight(
		backends.getCollection('ExternalMembers'),
		errorGenerator('Could not approve external member'),
	)
		.map(modifyAndBindC<RawCAPExternalMemberObject>(toReference(member)))
		.map(modify =>
			modify
				.patch({
					approved: Maybe.some({
						by: toReference(approver),
						when: backends.now(),
					}),
				})
				.execute(),
		)
		.map(destroy);
