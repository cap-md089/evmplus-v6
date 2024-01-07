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
	areMembersTheSame,
	AsyncEither,
	asyncLeft,
	asyncRight,
	CAPExternalMemberObject,
	CAPExternalMemberReference,
	CAPExtraMemberInformation,
	errorGenerator,
	get,
	getORGIDsFromRegularCAPAccount,
	isPartOfTeam,
	isRegularCAPAccountObject,
	RawCAPExternalMemberObject,
	RegularCAPAccountObject,
	ServerError,
	ShortDutyPosition,
	stripProp,
	toReference,
} from 'common-lib';
import { loadExtraCAPMemberInformation } from '.';
import { Backends } from '../../../backends';
import { collectResults, findAndBind, findAndBindC } from '../../../MySQLUtil';
import { RegistryBackend } from '../../../Registry';
import { TeamsBackend } from '../../../Team';

const getRowsForExternalMember = (schema: Schema) => (account: RegularCAPAccountObject) => (
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
		.filter(results => results.length === 1, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(get(0))
		.map(stripProp('_id'));

export const getExternalMembersForAccount = (schema: Schema) => (
	backend: Backends<[RegistryBackend, TeamsBackend]>,
) => (account: RegularCAPAccountObject): ServerEither<CAPExternalMemberObject[]> =>
	AsyncEither.All([
		backend.getRegistry(account),
		asyncRight(
			collectResults(
				findAndBind(schema.getCollection<RawCAPExternalMemberObject>('ExternalMembers'), {
					accountID: account.id,
				}),
			),
			errorGenerator('Could not get external members for account'),
		),
		asyncRight(
			collectResults(
				findAndBind(schema.getCollection<CAPExtraMemberInformation>('ExternalMembers'), {
					accountID: account.id,
				}),
			),
			errorGenerator('Could not load external members for account'),
		),
		backend.getTeams(account),
	]).map(([registry, members, orgExtraInfo, teamObjects]) =>
		members.map(member => {
			const memberID = toReference(member);
			const finder = areMembersTheSame(member);

			const extraInfo =
				orgExtraInfo.find(({ member: id }) => finder(id)) ??
				({
					accountID: account.id,
					member: memberID,
					temporaryDutyPositions: [],
					flight: null,
					teamIDs: teamObjects.filter(isPartOfTeam(memberID)).map(({ id }) => id),
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
		}),
	);

export const expandExternalMember = (schema: Schema) => (
	backends: Backends<[RegistryBackend, TeamsBackend]>,
) => (account: RegularCAPAccountObject) => (
	info: RawCAPExternalMemberObject,
): ServerEither<CAPExternalMemberObject> =>
	backends.getRegistry(account).flatMap(registry =>
		asyncRight(info.id, errorGenerator('Could not get member information'))
			.flatMap(id =>
				loadExtraCAPMemberInformation(schema)(backends)(account)({
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
