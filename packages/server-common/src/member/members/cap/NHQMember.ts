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
import axios from 'axios';
import {
	AccountObject,
	areMembersTheSame,
	AsyncEither,
	asyncRight,
	CAPAccountObject,
	CAPExtraMemberInformation,
	CAPMemberContact,
	CAPMemberContactType,
	CAPNHQMemberObject,
	CAPNHQMemberReference,
	collectGenerator,
	errorGenerator,
	get as getProp,
	getMemberName,
	getORGIDsFromCAPAccount,
	isPartOfTeam,
	iterFilter,
	iterMap,
	Maybe,
	NHQ,
	RawTeamObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	stripProp,
} from 'common-lib';
import { createWriteStream } from 'fs';
import { DateTime } from 'luxon';
import { join } from 'path';
import { loadExtraCAPMemberInformation } from '.';
import { AccountBackend } from '../../..';
import { Backends } from '../../../backends';
import {
	bindForArray,
	collectResults,
	collectSqlResults,
	findAndBind,
	findAndBindC,
} from '../../../MySQLUtil';
import { ServerEither } from '../../../servertypes';
import { TeamsBackend } from '../../../Team';

export const getCAPNHQMembersForORGIDs = (schema: Schema) => (accountID: string) => (
	rawTeamObjects: RawTeamObject[],
) => (ORGIDs: number[]) =>
	asyncRight(
		Promise.all([
			collectSqlResults<NHQ.NHQMember>(
				schema
					.getSession()
					.sql(
						`
						SELECT doc FROM
							${schema.getName()}.NHQ_Member
						WHERE
							ORGID in ${bindForArray(ORGIDs)};
						`,
					)
					.bind(ORGIDs),
			),
			collectSqlResults<NHQ.MbrContact>(
				schema
					.getSession()
					.sql(
						`
						SELECT C.doc FROM
							${schema.getName()}.NHQ_MbrContact AS C
						INNER JOIN
							${schema.getName()}.NHQ_Member AS M
						ON
							C.CAPID = M.CAPID
						WHERE
							M.ORGID in ${bindForArray(ORGIDs)};
						`,
					)
					.bind(ORGIDs),
			),
			collectResults(
				findAndBind(
					schema.getCollection<CAPExtraMemberInformation>('ExtraMemberInformation'),
					{
						accountID,
					},
				),
			),
			collectSqlResults<NHQ.DutyPosition>(
				schema
					.getSession()
					.sql(
						`
						SELECT doc FROM
							${schema.getName()}.NHQ_DutyPosition
						WHERE
							ORGID in ${bindForArray(ORGIDs)};
					`,
					)
					.bind(ORGIDs),
			),
			collectSqlResults<NHQ.CadetDutyPosition>(
				schema
					.getSession()
					.sql(
						`
						SELECT doc FROM
							${schema.getName()}.NHQ_CadetDutyPosition
						WHERE
							ORGID in ${bindForArray(ORGIDs)};
					`,
					)
					.bind(ORGIDs),
			),
		]),
		errorGenerator('Could not get member information for ORGIDs ' + ORGIDs.join(',')),
	).map(([orgMembers, orgContacts, orgExtraInfo, orgDutyPositions, orgCadetDutyPositions]) =>
		orgMembers.map<CAPNHQMemberObject>(member => {
			const memberID = {
				type: 'CAPNHQMember',
				id: member.CAPID,
			} as const;
			const finder = areMembersTheSame(memberID);

			const extraInfo =
				orgExtraInfo.find(({ member: id }) => finder(id)) ??
				({
					accountID,
					member: memberID,
					temporaryDutyPositions: [],
					flight: null,
					teamIDs: rawTeamObjects.filter(isPartOfTeam(memberID)).map(({ id }) => id),
					absentee: null,
					type: 'CAP',
				} as CAPExtraMemberInformation);

			const contact: CAPMemberContact = {
				CADETPARENTEMAIL: {},
				CADETPARENTPHONE: {},
				CELLPHONE: {},
				EMAIL: {},
				HOMEPHONE: {},
				WORKPHONE: {},
			};

			orgContacts
				.filter(contactItem => contactItem.CAPID === member.CAPID)
				.forEach(contactItem => {
					const contactType = contactItem.Type.toUpperCase().replace(
						/ /g,
						'',
					) as CAPMemberContactType;

					// Handles the types we don't support
					// Or, erroneous data left in by NHQ
					if (contactType in contact) {
						contact[contactType][contactItem.Priority] = contactItem.Contact;
					}
				});

			const dutyPositions: ShortDutyPosition[] = [
				...orgDutyPositions
					.filter(({ CAPID }) => CAPID === member.CAPID)
					.map(dp => ({
						duty: dp.Duty,
						date: +DateTime.fromISO(dp.DateMod),
						orgid: dp.ORGID,
						type: 'NHQ' as const,
					})),
				...orgCadetDutyPositions
					.filter(({ CAPID }) => CAPID === member.CAPID)
					.map(dp => ({
						duty: dp.Duty,
						date: +DateTime.fromISO(dp.DateMod),
						orgid: dp.ORGID,
						type: 'NHQ' as const,
					})),
				...extraInfo.temporaryDutyPositions.map(dp => ({
					duty: dp.Duty,
					date: dp.assigned,
					expires: dp.validUntil,
					type: 'CAPUnit' as const,
				})),
			];

			return {
				absenteeInformation: extraInfo.absentee,
				contact,
				dateOfBirth: +DateTime.fromISO(member.DOB),
				dutyPositions,
				expirationDate: +DateTime.fromISO(member.Expiration),
				flight: extraInfo.flight,
				id: member.CAPID,
				memberRank: member.Rank,
				nameFirst: member.NameFirst,
				nameLast: member.NameLast,
				nameMiddle: member.NameMiddle,
				nameSuffix: member.NameSuffix,
				orgid: member.ORGID,
				seniorMember: member.Type !== 'CADET',
				squadron: `${member.Region}-${member.Wing}-${member.Unit}`,
				teamIDs: extraInfo.teamIDs,
				type: 'CAPNHQMember',
				usrID: member.UsrID,
			};
		}),
	);

const getCAPWATCHContactForMember = (schema: Schema) => (id: number) =>
	asyncRight(
		schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact'),
		errorGenerator('Could not get member contact information'),
	)
		.map(
			findAndBindC<NHQ.MbrContact>({ CAPID: id }),
		)
		.map(collectResults)
		.map(capwatchContact => {
			const memberContact: CAPMemberContact = {
				CADETPARENTEMAIL: {},
				CADETPARENTPHONE: {},
				CELLPHONE: {},
				EMAIL: {},
				HOMEPHONE: {},
				WORKPHONE: {},
			};

			capwatchContact.forEach(val => {
				const contactType = val.Type.toUpperCase().replace(
					/ /g,
					'',
				) as CAPMemberContactType;

				if (contactType in memberContact) {
					memberContact[contactType][val.Priority] = val.Contact;
				}
			});

			return memberContact;
		});

const getNHQDutyPositions = (schema: Schema) => (orgids: number[]) => (
	CAPID: number,
): AsyncEither<ServerError, ShortDutyPosition[]> =>
	asyncRight(
		Promise.all([
			collectResults(
				schema
					.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition')
					.find('CAPID = :CAPID')
					.bind('CAPID', CAPID),
			),
			collectResults(
				schema
					.getCollection<NHQ.CadetDutyPosition>('NHQ_CadetDutyPosition')
					.find('CAPID = :CAPID')
					.bind('CAPID', CAPID),
			),
		]),
		errorGenerator('Could not get duty positions'),
	)
		.map(([duties, cadetDuties]) => [...duties, ...cadetDuties])
		.map(
			iterMap(item => ({
				duty: item.Duty,
				date: +DateTime.fromISO(item.DateMod),
				orgid: item.ORGID,
				type: 'NHQ' as const,
			})),
		)
		.map(iterFilter(item => orgids.includes(item.orgid)))
		.map(collectGenerator);

const getNHQMemberRows = (schema: Schema) => (CAPID: number) =>
	asyncRight(
		schema.getCollection<NHQ.NHQMember>('NHQ_Member'),
		errorGenerator('Could not get member information'),
	)
		.map(
			findAndBindC<NHQ.NHQMember>({ CAPID }),
		)
		.map(collectResults)
		.filter(results => results.length === 1, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(results => results[0])
		.map(stripProp('_id'));

export const getNHQMember = (schema: Schema) => (backend: Backends<[TeamsBackend]>) => (
	account: AccountObject,
) => (CAPID: number) =>
	asyncRight(CAPID, errorGenerator('Could not get member information'))
		.flatMap(id =>
			AsyncEither.All([
				getNHQMemberRows(schema)(id),
				getCAPWATCHContactForMember(schema)(id),
				Maybe.orSome<AsyncEither<ServerError, ShortDutyPosition[]>>(
					asyncRight(
						[] as ShortDutyPosition[],
						errorGenerator('Could not get duty positions'),
					),
				)(
					Maybe.map((orgids: number[]) => getNHQDutyPositions(schema)(orgids)(id))(
						getORGIDsFromCAPAccount(account),
					),
				),
				loadExtraCAPMemberInformation(schema)(backend)(account)({
					id,
					type: 'CAPNHQMember',
				}),
			]),
		)
		.map<CAPNHQMemberObject>(([info, contact, dutyPositions, extraInformation]) => ({
			absenteeInformation: extraInformation.absentee,
			contact,
			dateOfBirth: +DateTime.fromISO(info.DOB),
			dutyPositions: [
				...dutyPositions,
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
			expirationDate: +DateTime.fromISO(info.Expiration),
			flight: extraInformation.flight,
			id: info.CAPID,
			memberRank: info.Rank,
			nameFirst: info.NameFirst,
			nameLast: info.NameLast,
			nameMiddle: info.NameMiddle,
			nameSuffix: info.NameSuffix,
			orgid: info.ORGID,
			seniorMember: info.Type !== 'CADET',
			squadron: `${info.Region}-${info.Wing}-${info.Unit}`,
			type: 'CAPNHQMember',
			usrID: info.UsrID,
			teamIDs: extraInformation.teamIDs,
		}));

export const getExtraInformationFromCAPNHQMember = (account: AccountObject) => (
	member: CAPNHQMemberObject,
): CAPExtraMemberInformation => ({
	absentee: member.absenteeInformation,
	accountID: account.id,
	flight: member.flight,
	member: {
		type: 'CAPNHQMember',
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

export const getNameForCAPNHQMember = (schema: Schema) => (reference: CAPNHQMemberReference) =>
	getNHQMemberRows(schema)(reference.id).map(
		result =>
			`${result.Rank} ${getMemberName({
				nameFirst: result.NameFirst,
				nameMiddle: result.NameMiddle,
				nameLast: result.NameLast,
				nameSuffix: result.NameSuffix,
			})}`,
	);

export const getNHQMemberAccount = (backend: Backends<[AccountBackend]>) => (
	member: CAPNHQMemberObject,
): ServerEither<CAPAccountObject[]> => backend.getCAPAccountsByORGID(member.orgid);

export const getBirthday = (schema: Schema) => (member: CAPNHQMemberReference) =>
	getNHQMemberRows(schema)(member.id).map(getProp('DOB')).map(DateTime.fromISO);

export const downloadCAPWATCHFile = (
	orgid: number,
	capid: number,
	password: string,
	downloadPath: string,
): ServerEither<string> => {
	const today = new Date();
	const fileName = join(
		downloadPath,
		`CAPWATCH-${capid}-${orgid}-${today.getFullYear()}-${
			today.getMonth() + 1
		}-${today.getDate()}.zip`,
	);

	const encodedAuth = Buffer.from(`${capid}:${password}`, 'ascii').toString('base64');
	const url = `https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?unitOnly=0&ORGID=${orgid}`;

	const storageLocation = createWriteStream(fileName);

	console.log(fileName);

	return asyncRight(
		axios({
			method: 'get',
			url,
			headers: {
				authorization: `Basic ${encodedAuth}`,
			},
			responseType: 'stream',
		}),
		errorGenerator('Could not download CAPWATCH file'),
	)
		.map(({ data }) => {
			data.pipe(storageLocation);

			return Promise.all([
				Promise.resolve(fileName),
				new Promise<void>(res => {
					data.on('end', res);
				}),
				new Promise<void>(res => {
					storageLocation.on('end', res);
				}),
			]);
		})
		.map(([filepath]) => filepath);
};
