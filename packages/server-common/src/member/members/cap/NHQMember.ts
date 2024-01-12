/* eslint-disable jsdoc/check-alignment */
/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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

import { Cursor, Schema } from '@mysql/xdevapi';
import axios from 'axios';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	asyncLeft,
	asyncRight,
	CadetAprvStatus,
	CadetPromotionStatus,
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
	identity,
	isPartOfTeam,
	iterFilter,
	iterMap,
	Maybe,
	NHQ,
	RawCAPSquadronAccountObject,
	RawTeamObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	ShortNHQDutyPosition,
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
	convertNHQDate,
	findAndBind,
	findAndBindC,
} from '../../../MySQLUtil';
import { ServerEither } from '../../../servertypes';
import { TeamsBackend } from '../../../Team';

export const getCAPNHQMembersForORGIDs = (schema: Schema) => (accountID: string) => (
	rawTeamObjects: RawTeamObject[],
) => (ORGIDs: number[]): ServerEither<CAPNHQMemberObject[]> =>
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
		orgMembers
			.filter(
				({ Expiration }) =>
					new Date(Expiration).getTime() >
					new Date().getTime() - 60 * 60 * 24 * 90 * 1000,
			)
			.map<CAPNHQMemberObject>(member => {
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

				const dutyPositions = [
					...(orgDutyPositions
						.filter(({ CAPID }) => CAPID === member.CAPID)
						.map(dp => ({
							duty: dp.Duty,
							date: +DateTime.fromISO(dp.DateMod),
							orgid: dp.ORGID,
							assistant: dp.Asst === 1,
							type: 'NHQ' as const,
						})) as ShortNHQDutyPosition[]),
					...(orgCadetDutyPositions
						.filter(({ CAPID }) => CAPID === member.CAPID)
						.map(dp => ({
							duty: dp.Duty,
							date: +DateTime.fromISO(dp.DateMod),
							orgid: dp.ORGID,
							assistant: dp.Asst === 1,
							type: 'NHQ' as const,
						})) as ShortNHQDutyPosition[]),
					...(extraInfo.temporaryDutyPositions.map(dp => ({
						duty: dp.Duty,
						date: dp.assigned,
						expires: dp.validUntil,
						type: 'CAPUnit' as const,
					})) as ShortCAPUnitDutyPosition[]),
				];

				return {
					absenteeInformation: extraInfo.absentee,
					contact,
					dateOfBirth: +DateTime.fromISO(member.DOB),
					dutyPositions,
					expirationDate: +DateTime.fromISO(member.Expiration),
					flight: extraInfo.flight,
					gender: member.Gender,
					id: member.CAPID,
					joined: +DateTime.fromISO(member.Joined),
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
				assistant: item.Asst === 1,
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
) => (CAPID: number): ServerEither<CAPNHQMemberObject> =>
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
		.map(([info, contact, dutyPositions, extraInformation]) => ({
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
			gender: info.Gender,
			id: info.CAPID,
			joined: +DateTime.fromISO(info.Joined),
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

export const getNameForCAPNHQMember = (schema: Schema) => (
	reference: CAPNHQMemberReference,
): ServerEither<string> =>
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

export const getBirthday = (schema: Schema) => (
	member: CAPNHQMemberReference,
): ServerEither<DateTime> =>
	getNHQMemberRows(schema)(member.id)
		.map(getProp('DOB'))
		.map(val => DateTime.fromISO(val));

export const downloadCAPWATCHFile = (
	orgid: number,
	capid: number,
	password: string,
	downloadPath: string,
): ServerEither<string> => {
	const today = new Date();
	const fileName = join(
		downloadPath,
		`CAPWATCH-${capid}-${orgid}-${today.getFullYear()}-${(today.getMonth() + 1)
			.toString()
			.padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.zip`,
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
			data.pipe(storageLocation);

			return Promise.all([
				Promise.resolve(fileName),
				new Promise<void>(res => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
					data.on('end', res);
				}),
				new Promise<void>(res => {
					storageLocation.on('end', res);
				}),
			]);
		})
		.map(([filepath]) => filepath);
};

/**
 * __        ___    ____  _   _ ___ _   _  ____
 * \ \      / / \  |  _ \| \ | |_ _| \ | |/ ___|
 *  \ \ /\ / / _ \ | |_) |  \| || ||  \| | |  _
 *   \ V  V / ___ \|  _ <| |\  || || |\  | |_| |
 *    \_/\_/_/   \_\_| \_\_| \_|___|_| \_|\____|
 *
 * The following code was written in a time crunch and to be optimized. It is not optimized
 * for human readability, and has multiple sections which are highly dependent on each other,
 * with phantom mental states and dependence on the order of operations being executed with no
 * assertions such as if such dependencies are met, and the cherry on top is that all the
 * values from the database are JSON encoded with little type safety. We'll see how far this
 * code goes...
 */

/**
 * SQL commands run to get the database to the right place:
	ALTER TABLE NHQ_PL_Tasks ADD COLUMN TaskID int GENERATED ALWAYS AS (doc ->> '$.TaskID') STORED;
	ALTER TABLE NHQ_PL_MemberTaskCredit ADD COLUMN TaskID int GENERATED ALWAYS AS (doc ->> '$.TaskID') STORED;
	ALTER TABLE NHQ_PL_MemberTaskCredit ADD COLUMN CAPID int GENERATED ALWAYS AS (doc ->> '$.CAPID') STORED;
	alter table NHQ_PL_Paths add column PathID int GENERATED ALWAYS AS (doc ->> '$.PathID') stored not null;
	alter table NHQ_PL_MemberPathCredit add column CAPID int GENERATED ALWAYS AS (doc ->> '$.CAPID') stored not null;
	alter table NHQ_PL_MemberPathCredit add column PathID int GENERATED ALWAYS AS (doc ->> '$.PathID') stored not null;
	alter table NHQ_PL_TaskGroupAssignments add column GroupID int generated always as (doc ->> '$.GroupID') stored not null;
	alter table NHQ_PL_TaskGroupAssignments add column TaskID int generated always as (doc ->> '$.TaskID') stored not null;
	alter table NHQ_PL_Groups add column PathID int generated always as (doc ->> '$.PathID') stored not null;
	alter table NHQ_PL_Groups add column GroupID int generated always as (doc ->> '$.GroupID') stored not null;
	alter table NHQ_PL_MemberTaskCredit ADD COLUMN MemberTaskCreditID int GENERATED ALWAYS AS (doc ->> '$.MemberTaskCreditID') STORED NOT NULL;
	create unique index MemberTaskCreditID on NHQ_PL_MemberTaskCredit (MemberTaskCreditID);
	create index CAPID on NHQ_PL_MemberTaskCredit (CAPID);
	create index TaskID on NHQ_PL_MemberTaskCredit (TaskID);
	create unique index TaskID on NHQ_PL_Tasks (TaskID);
	create index GroupID on NHQ_PL_TaskGroupAssignments (GroupID);
	create index TaskID on NHQ_PL_TaskGroupAssignments (TaskID);
	create index GroupID on NHQ_PL_Groups (GroupID);
	create index PathID on NHQ_PL_Groups (PathID);
	create unique index PathID on NHQ_PL_Paths (PathID);
	create index CAPID on NHQ_PL_MemberPathCredit (CAPID);
	create index PathID on NHQ_PL_MemberPathCredit (PathID);

	alter table NHQ_CadetAchv add column CAPID int generated always as (doc ->> '$.CAPID') stored not null;
	alter table NHQ_CadetAchv add column CadetAchvID int generated always as (doc ->> '$.CadetAchvID') stored not null;
	create index CAPID on NHQ_CadetAchv (CAPID, CadetAchvID);
	ALTER TABLE NHQ_CadetAchvAprs ADD COLUMN CAPID int GENERATED ALWAYS AS (doc ->> '$.CAPID') STORED NOT NULL;
	alter table NHQ_CadetAchvAprs add column CadetAchvID int generated always as (doc ->> '$.CadetAchvID') stored not null;
	create index CAPID on NHQ_CadetAchvAprs (CAPID, CadetAchvID);
	alter table NHQ_CadetActivities ADD COLUMN Type varchar(63) GENERATED ALWAYS AS (doc ->> '$.Type') STORED;
	alter table NHQ_CadetActivities ADD COLUMN CAPID int GENERATED ALWAYS AS (doc ->> '$.CAPID') STORED NOT NULL;
	alter table NHQ_CadetHFZInformation ADD COLUMN HFZID int GENERATED ALWAYS AS (doc ->> '$.HFZID') STORED NOT NULL;
	alter table NHQ_OFlight add column CAPID int GENERATED ALWAYS AS (doc ->> '$.CAPID') stored not null;
 */

const getPromotionRequirementsSql = (orgids: number[]): string => `\
WITH
	MEMBERS AS (SELECT CAPID FROM NHQ_Member WHERE ORGID IN ${bindForArray(
		orgids,
	)} AND doc ->> '$.Type' = 'CADET'),
	AEROSDA AS (SELECT MemberTaskCreditID, TaskName, MTC.TaskID, MTC.CAPID, Completed, AdditionalOptions,
			IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) AS PathID
			FROM NHQ_PL_MemberTaskCredit MTC
			INNER JOIN MEMBERS M ON M.CAPID = MTC.CAPID
			INNER JOIN NHQ_PL_Tasks T ON MTC.TaskID = T.TaskID
			WHERE IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) >= 31
					AND IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) <= 51),
	OTHERTASKS AS (SELECT MemberTaskCreditID, TaskName, MTC.TaskID, MTC.CAPID, Completed, AdditionalOptions, G.PathID
			FROM NHQ_PL_MemberTaskCredit MTC
			INNER JOIN MEMBERS M ON M.CAPID = MTC.CAPID
			INNER JOIN NHQ_PL_TaskGroupAssignments TGA ON MTC.TaskID = TGA.TaskID
			INNER JOIN NHQ_PL_Groups G ON TGA.GroupID = G.GroupID
			INNER JOIN NHQ_PL_Tasks T ON T.TaskID = MTC.TaskID
			WHERE (PathID >= 31 AND PathID <= 51) AND
				(MTC.TaskID < 324 OR
				(MTC.TaskID > 324 AND MTC.TaskID < 334) OR
				(MTC.TaskID > 339 AND MTC.TaskID < 375) OR
				(MTC.TaskID > 375 AND MTC.TaskID < 384) OR
				(MTC.TaskID > 391 AND MTC.TaskID < 394) OR
				MTC.TaskID > 399)),
	MEMBERTASKS AS (SELECT CAPID, TaskName, TaskID, Completed, PathID, AdditionalOptions FROM AEROSDA
				UNION SELECT CAPID, TaskName, TaskID, Completed, PathID, AdditionalOptions FROM OTHERTASKS),
	CURRENTTASKS AS (SELECT MT.CAPID, TaskName, TaskID, Completed, MT.PathID, AdditionalOptions
					FROM MEMBERTASKS MT
					LEFT JOIN NHQ_PL_MemberPathCredit MPC ON (MT.CAPID = MPC.CAPID AND MT.PathID = MPC.PathID)
					WHERE MPC.CAPID IS NULL)
SELECT CAPID, Completed, TaskName, AdditionalOptions FROM CURRENTTASKS`;

const getAchvsSql = (orgids: number[]): string => `\
WITH
	MEMBERS AS (SELECT CAPID FROM NHQ_Member WHERE ORGID IN ${bindForArray(
		orgids,
	)} AND doc ->> '$.Type' = 'CADET'),
	ACTIVITIES AS (SELECT A.CAPID, IF(doc ->> '$.Type' = "ENCAMP", 0, 1), doc -> '$.Completed' FROM NHQ_CadetActivities A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
		WHERE doc ->> '$.Type' IN ("ENCAMP", "RCLS")),
	GES AS (SELECT A.CAPID, 2, A.doc FROM NHQ_MbrAchievements A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
		WHERE A.AchvID = 53),
	OFLIGHT AS (SELECT O.CAPID, 3, doc FROM NHQ_OFlight O
		INNER JOIN MEMBERS M ON M.CAPID = O.CAPID),
	MAXPATHCREDIT AS (SELECT MPC.CAPID, 4, MPC.doc FROM NHQ_PL_MemberPathCredit MPC
		INNER JOIN MEMBERS M ON M.CAPID = MPC.CAPID
		WHERE MPC.doc ->> '$.MemberPathCreditID' IN (SELECT * FROM (SELECT doc ->> '$.MemberPathCreditID' FROM NHQ_PL_MemberPathCredit MPCI
			WHERE PathID >= 31 AND PathID <= 51 AND MPCI.CAPID = MPC.CAPID
			ORDER BY PathID DESC
			LIMIT 1) temp_tab)),
	LASTAPRV AS (SELECT MPC.CAPID, 5, MPC.doc FROM NHQ_PL_MemberPathCredit MPC
		INNER JOIN MEMBERS M ON M.CAPID = MPC.CAPID
		WHERE MPC.doc ->> '$.MemberPathCreditID' IN (SELECT * FROM (SELECT doc ->> '$.MemberPathCreditID' FROM NHQ_PL_MemberPathCredit MPCI
			WHERE PathID >= 31 AND PathID <= 51 AND MPCI.CAPID = MPC.CAPID AND doc ->> '$.StatusID' = 8
			ORDER BY PathID DESC
			LIMIT 1) temp_tab)),
	LASTHFZ AS (SELECT HFZ.CAPID, 6, HFZ.doc FROM NHQ_CadetHFZInformation HFZ
		INNER JOIN MEMBERS M ON M.CAPID = HFZ.CAPID
		WHERE HFZ.HFZID IN (SELECT * FROM (SELECT HFZID FROM NHQ_CadetHFZInformation HFZI
			WHERE HFZI.CAPID = HFZ.CAPID
			ORDER BY doc ->> '$.DateTaken' DESC
			LIMIT 1) temp_tab)),
	LASTHFZPASS AS (SELECT HFZ.CAPID, 6, HFZ.doc FROM NHQ_CadetHFZInformation HFZ
		INNER JOIN MEMBERS M ON M.CAPID = HFZ.CAPID
		WHERE HFZ.HFZID IN (SELECT * FROM (SELECT HFZID FROM NHQ_CadetHFZInformation HFZI
			WHERE HFZI.CAPID = HFZ.CAPID AND HFZI.doc ->> '$.IsPassed' = 'true'
			ORDER BY doc ->> '$.DateTaken' DESC
			LIMIT 1) temp_tab))
(SELECT * FROM ACTIVITIES) UNION
(SELECT * FROM GES) UNION
(SELECT * FROM OFLIGHT) UNION
(SELECT * FROM MAXPATHCREDIT) UNION
(SELECT * FROM LASTAPRV) UNION
(SELECT * FROM LASTHFZ) UNION
(SELECT * FROM LASTHFZPASS);`;

interface AchvResultsReducersState {
	maxApproval: { Status: CadetAprvStatus; CadetAchvID: number } | null;
	maxApprovedApproval: NHQ.CadetAchvAprs;
}

const promotionResultReducers: Array<{
	matches: RegExp;
	update: (
		status: CadetPromotionStatus,
		completion: string,
		task: string,
		additionalOptions: string,
		capid: number,
	) => CadetPromotionStatus;
}> = [
	{
		matches: /Cadet Interactive Leadership Module \d+$/,
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						LeadLabDateP: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					LeadLabDateP: convertNHQDate(completion).toISOString(),
					LeadLabScore: parseInt(scoreResult[1], 10),
				},
			};
		},
	},
	{
		matches: /Drill and Ceremonies/,
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						DrillDate: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					DrillDate: convertNHQDate(completion).toISOString(),
					DrillScore: parseInt(scoreResult[1], 10),
				},
			};
		},
	},
	{
		matches: /Learn to Lead/,
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						LeadLabDateP: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					LeadLabDateP: convertNHQDate(completion).toISOString(),
					LeadLabScore: parseInt(scoreResult[1], 10),
				},
			};
		},
	},
	{
		matches: /Cadet Oath/,
		update: status => ({
			...status,
			CurrentCadetAchv: {
				...status.CurrentCadetAchv,
				CadetOath: true,
			},
		}),
	},
	{
		matches: /(Character Forum Participation|Cadet Wingman Course)/,
		update: (status, completion) => ({
			...status,
			CurrentCadetAchv: {
				...status.CurrentCadetAchv,
				MoralLDateP: convertNHQDate(completion).toISOString(),
			},
		}),
	},
	{
		matches: /Aerospace Dimensions/,
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const aeMod = task.match(/Aerospace Dimensions (\d)/);

			if (!scoreResult || !aeMod) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						AEDateP: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					AEDateP: convertNHQDate(completion).toISOString(),
					AEScore: parseInt(scoreResult[1], 10),
					AEMod: parseInt(aeMod[1], 10),
				},
			};
		},
	},
	{
		matches: /Journey of Flight Test/,
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const aeTest = task.match(/Journey of Flight Test (\d)/);

			if (!scoreResult || !aeTest) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						AEDateP: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					AEDateP: convertNHQDate(completion).toISOString(),
					AEScore: parseInt(scoreResult[1], 10),
					AETest: parseInt(aeTest[1], 10),
				},
			};
		},
	},
	{
		matches: /SDA Technical Writing Assignment/,
		update: (status, completion, _, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const twa = addtlOpts.match(/ - (.*)$/);

			if (!scoreResult || !twa) {
				return {
					...status,
					CurrentCadetAchv: {
						...status.CurrentCadetAchv,
						TechnicalWritingAssignmentDate: convertNHQDate(completion).toISOString(),
					},
				};
			}

			return {
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					TechnicalWritingAssignmentDate: convertNHQDate(completion).toISOString(),
					TechnicalWritingAssignment: twa[1],
				},
			};
		},
	},
	{
		matches: /Active Participation/,
		update: status => ({
			...status,
			CurrentCadetAchv: {
				...status.CurrentCadetAchv,
				ActivePart: true,
			},
		}),
	},
	{
		matches: /Leadership Expectations/,
		update: (status, completion) => ({
			...status,
			CurrentCadetAchv: {
				...status.CurrentCadetAchv,
				StaffServiceDate: convertNHQDate(completion).toISOString(),
			},
		}),
	},
	{
		matches: /SDA Oral Presentation/,
		update: (status, completion) => ({
			...status,
			CurrentCadetAchv: {
				...status.CurrentCadetAchv,
				OralPresentationDate: convertNHQDate(completion).toISOString(),
			},
		}),
	},
];

const reducePromotionResults = (
	[status, state]: [CadetPromotionStatus, AchvResultsReducersState],
	[capid, completion, task, addtlOpts]: [number, string, string, string],
): [CadetPromotionStatus, AchvResultsReducersState] => {
	const func = promotionResultReducers.find(({ matches }) => matches.test(task));
	return [(func?.update ?? identity)(status, completion, task, addtlOpts, capid), state];
};

const achvResultsReducers: Array<
	(
		statusState: [status: CadetPromotionStatus, state: AchvResultsReducersState],
		res: any,
	) => [CadetPromotionStatus, AchvResultsReducersState]
> = [
	(
		// encampment
		[status, state],
		res,
	) => [{ ...status, EncampDate: Maybe.some(+new Date(res)) }, state],
	(
		// rcls
		[status, state],
		res,
	) => [{ ...status, RCLSDate: Maybe.some(+new Date(res)) }, state],
	(
		// ges
		[status, state],
		res,
	) => [{ ...status, ges: Maybe.some(res as NHQ.MbrAchievements) }, state],
	(
		// oflights
		[status, state],
		res,
	) => [
		{
			...status,
			oflights: [...status.oflights, res as NHQ.OFlight],
		},
		state,
	],
	(
		// max path credit
		[status, state],
		res,
	) => {
		const { PathID, StatusID } = res as NHQ.PL.MemberPathCredit;

		const AchvID = PathID - 30;
		const STATUS_PENDING = 26;

		return [
			{
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
					CadetAchvID: StatusID === STATUS_PENDING ? AchvID - 1 : AchvID,
				},
				CurrentCadetGradeID: StatusID === STATUS_PENDING ? AchvID - 1 : AchvID,
				NextCadetGradeID: StatusID === STATUS_PENDING ? AchvID : AchvID + 1,
				NextCadetAchvID: StatusID === STATUS_PENDING ? AchvID : AchvID + 1,
				MaxAprvStatus: StatusID === STATUS_PENDING ? 'PND' : 'INC',
			},
			state,
		];
	},
	(
		// max aprv credit
		[status, state],
		res,
	) => {
		const { Completed } = res as NHQ.PL.MemberPathCredit;

		return [
			{
				...status,
				CurrentCadetAchv: {
					...status.CurrentCadetAchv,
				},
				LastAprvDate: Maybe.some(+convertNHQDate(Completed)),
			},
			state,
		];
	},
	(
		// hfz
		[status, state],
		res,
	) => [
		{
			...status,
			HFZRecord: Maybe.some(res as NHQ.CadetHFZInformation),
		},
		state,
	],
];

export const getUnitPromotionRequirements = (schema: Schema) => (
	account: RawCAPSquadronAccountObject,
): ServerEither<{ [CAPID: number]: CadetPromotionStatus }> =>
	asyncRight(
		schema.getSession(),
		errorGenerator('Could not get promotion requirements for the unit'),
	)
		.map(session =>
			session
				.sql('USE ' + schema.getName())
				.execute()
				.then(always(session)),
		)
		.flatMap(session =>
			AsyncEither.All([
				asyncRight<ServerError, Cursor<[number, string, string, string]>>(
					session
						.sql(getPromotionRequirementsSql(account.orgIDs))
						.bind(account.orgIDs)
						.execute(),
					errorGenerator('Could not load PL data'),
				),
				asyncRight<ServerError, Cursor<[number, number, string]>>(
					session.sql(getAchvsSql(account.orgIDs)).bind(account.orgIDs).execute(),
					errorGenerator('Could not load cadet achievement data'),
				),
			]),
		)
		.map(([plResults, achvResults]) =>
			plResults.fetchAll().reduce(
				(promotionMap, [CAPID, Completion, Task, addtlOpts]) =>
					promotionMap[CAPID]
						? {
								...promotionMap,
								[CAPID]: reducePromotionResults(promotionMap[CAPID], [
									CAPID,
									Completion,
									Task,
									addtlOpts,
								]),
						  }
						: promotionMap,
				achvResults.fetchAll().reduce(
					(promotionMap, [CAPID, achvType, achvResult]) => ({
						...promotionMap,
						[CAPID]: achvResultsReducers[achvType](
							promotionMap[CAPID] ?? [
								emptyCadetPromotionStatus,
								{ maxApproval: null },
							],
							achvResult,
						),
					}),
					{} as {
						[CAPID: number]: [CadetPromotionStatus, AchvResultsReducersState];
					},
				),
			),
		)
		.map(
			results =>
				Object.fromEntries(
					Object.entries(results).map(([key, value]) => [key, value[0]]),
				) as { [CAPID: number]: CadetPromotionStatus },
		);

const getPromotionRequirementsForMemberSql = `\
WITH
	MEMBERS AS (SELECT ? AS CAPID FROM dual),
	AEROSDA AS (SELECT MemberTaskCreditID, TaskName, MTC.TaskID, MTC.CAPID, Completed, AdditionalOptions,
			IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) AS PathID
			FROM NHQ_PL_MemberTaskCredit MTC
			INNER JOIN MEMBERS M ON M.CAPID = MTC.CAPID
			INNER JOIN NHQ_PL_Tasks T ON MTC.TaskID = T.TaskID
			WHERE IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) >= 31
					AND IF((LEFT(AdditionalOptions, 12) = '{PunchedPath'), CAST(SUBSTR(AdditionalOptions, 14, 2) AS UNSIGNED), 0) <= 51),
	OTHERTASKS AS (SELECT MemberTaskCreditID, TaskName, MTC.TaskID, MTC.CAPID, Completed, AdditionalOptions, G.PathID
			FROM NHQ_PL_MemberTaskCredit MTC
			INNER JOIN MEMBERS M ON M.CAPID = MTC.CAPID
			INNER JOIN NHQ_PL_TaskGroupAssignments TGA ON MTC.TaskID = TGA.TaskID
			INNER JOIN NHQ_PL_Groups G ON TGA.GroupID = G.GroupID
			INNER JOIN NHQ_PL_Tasks T ON T.TaskID = MTC.TaskID
			WHERE (PathID >= 31 AND PathID <= 51) AND
				(MTC.TaskID < 324 OR
				(MTC.TaskID > 324 AND MTC.TaskID < 334) OR
				(MTC.TaskID > 339 AND MTC.TaskID < 375) OR
				(MTC.TaskID > 375 AND MTC.TaskID < 384) OR
				(MTC.TaskID > 391 AND MTC.TaskID < 394) OR
				MTC.TaskID > 399)),
	MEMBERTASKS AS (SELECT CAPID, TaskName, TaskID, Completed, PathID, AdditionalOptions FROM AEROSDA
				UNION SELECT CAPID, TaskName, TaskID, Completed, PathID, AdditionalOptions FROM OTHERTASKS),
	CURRENTTASKS AS (SELECT MT.CAPID, TaskName, TaskID, Completed, MT.PathID, AdditionalOptions
					FROM MEMBERTASKS MT
					LEFT JOIN NHQ_PL_MemberPathCredit MPC ON (MT.CAPID = MPC.CAPID AND MT.PathID = MPC.PathID)
					WHERE MPC.CAPID IS NULL)
SELECT CAPID, Completed, TaskName, AdditionalOptions FROM CURRENTTASKS`;

const getAchvsForMemberSql = `\
WITH
	MEMBERS AS (SELECT ? AS CAPID FROM dual),
	ACTIVITIES AS (SELECT A.CAPID, IF(doc ->> '$.Type' = "ENCAMP", 0, 1), doc -> '$.Completed' FROM NHQ_CadetActivities A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
		WHERE doc ->> '$.Type' IN ("ENCAMP", "RCLS")),
	GES AS (SELECT A.CAPID, 2, A.doc FROM NHQ_MbrAchievements A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
		WHERE A.AchvID = 53),
	OFLIGHT AS (SELECT O.CAPID, 3, doc FROM NHQ_OFlight O
		INNER JOIN MEMBERS M ON M.CAPID = O.CAPID),
	MAXPATHCREDIT AS (SELECT MPC.CAPID, 4, MPC.doc FROM NHQ_PL_MemberPathCredit MPC
		INNER JOIN MEMBERS M ON M.CAPID = MPC.CAPID
		WHERE MPC.doc ->> '$.MemberPathCreditID' IN (SELECT * FROM (SELECT doc ->> '$.MemberPathCreditID' FROM NHQ_PL_MemberPathCredit MPCI
			WHERE PathID >= 31 AND PathID <= 51 AND MPCI.CAPID = MPC.CAPID
			ORDER BY PathID DESC
			LIMIT 1) temp_tab)),
	LASTAPRV AS (SELECT MPC.CAPID, 5, MPC.doc FROM NHQ_PL_MemberPathCredit MPC
		INNER JOIN MEMBERS M ON M.CAPID = MPC.CAPID
		WHERE MPC.doc ->> '$.MemberPathCreditID' IN (SELECT * FROM (SELECT doc ->> '$.MemberPathCreditID' FROM NHQ_PL_MemberPathCredit MPCI
			WHERE PathID >= 31 AND PathID <= 51 AND MPCI.CAPID = MPC.CAPID AND doc ->> '$.StatusID' = 8
			ORDER BY PathID DESC
			LIMIT 1) temp_tab)),
	LASTHFZ AS (SELECT HFZ.CAPID, 6, HFZ.doc FROM NHQ_CadetHFZInformation HFZ
		INNER JOIN MEMBERS M ON M.CAPID = HFZ.CAPID
		WHERE HFZ.HFZID IN (SELECT * FROM (SELECT HFZID FROM NHQ_CadetHFZInformation HFZI
			WHERE HFZI.CAPID = HFZ.CAPID
			ORDER BY doc ->> '$.DateTaken' DESC
			LIMIT 1) temp_tab)),
	LASTHFZPASS AS (SELECT HFZ.CAPID, 6, HFZ.doc FROM NHQ_CadetHFZInformation HFZ
		INNER JOIN MEMBERS M ON M.CAPID = HFZ.CAPID
		WHERE HFZ.HFZID IN (SELECT * FROM (SELECT HFZID FROM NHQ_CadetHFZInformation HFZI
			WHERE HFZI.CAPID = HFZ.CAPID AND HFZI.doc ->> '$.IsPassed' = 'true'
			ORDER BY doc ->> '$.DateTaken' DESC
			LIMIT 1) temp_tab))
(SELECT * FROM ACTIVITIES) UNION
(SELECT * FROM GES) UNION
(SELECT * FROM OFLIGHT) UNION
(SELECT * FROM MAXPATHCREDIT) UNION
(SELECT * FROM LASTAPRV) UNION
(SELECT * FROM LASTHFZ) UNION
(SELECT * FROM LASTHFZPASS);`;

export const getCadetPromotionRequirements = (schema: Schema) => (
	member: CAPNHQMemberObject,
): ServerEither<CadetPromotionStatus> =>
	member.seniorMember
		? asyncLeft<ServerError, CadetPromotionStatus>({
				type: 'OTHER',
				code: 400,
				message: 'Cannot get promotion requirements for a senior member',
		  })
		: asyncRight(schema.getSession(), errorGenerator('Could not load promotion requirements'))
				.map(session =>
					session
						.sql('USE ' + schema.getName())
						.execute()
						.then(always(session)),
				)
				.flatMap(session =>
					AsyncEither.All([
						asyncRight<ServerError, Cursor<[number, string, string, string]>>(
							session
								.sql(getPromotionRequirementsForMemberSql)
								.bind([member.id])
								.execute(),
							errorGenerator('Could not load PL data'),
						),
						asyncRight<ServerError, Cursor<[number, number, string]>>(
							session.sql(getAchvsForMemberSql).bind([member.id]).execute(),
							errorGenerator('Could not load cadet achievement data'),
						),
					]),
				)
				.map<CadetPromotionStatus>(
					([plResults, achvResults]) =>
						plResults.fetchAll().reduce(
							(promotionMap, [CAPID, Completion, Task, addtlOpts]) =>
								promotionMap[CAPID]
									? {
											...promotionMap,
											[CAPID]: reducePromotionResults(promotionMap[CAPID], [
												CAPID,
												Completion,
												Task,
												addtlOpts,
											]),
									  }
									: promotionMap,
							achvResults.fetchAll().reduce(
								(promotionMap, [CAPID, achvType, achvResult]) => ({
									...promotionMap,
									[CAPID]: achvResultsReducers[achvType](
										promotionMap[CAPID] ?? [
											emptyCadetPromotionStatus,
											{ maxApproval: null },
										],
										achvResult,
									),
								}),
								{} as {
									[CAPID: number]: [
										CadetPromotionStatus,
										AchvResultsReducersState,
									];
								},
							),
						)[member.id][0],
				);

export const emptyCadetAchv: NHQ.CadetAchv = {
	CAPID: 0,
	CadetAchvID: 0,
	PhyFitTest: '1900-01-01T05:00:00.000Z',
	LeadLabDateP: '1900-01-01T05:00:00.000Z',
	LeadLabScore: 0,
	AEDateP: '1900-01-01T05:00:00.000Z',
	AEScore: 0,
	AEMod: 0,
	AETest: 0,
	MoralLDateP: '1900-01-01T05:00:00.000Z',
	ActivePart: false,
	OtherReq: false,
	SDAReport: false,
	UsrID: '',
	DateMod: '1900-01-01T05:00:00.000Z',
	FirstUsr: '',
	DateCreated: '1900-01-01T05:00:00.000Z',
	DrillDate: '1900-01-01T05:00:00.000Z',
	DrillScore: 0,
	LeadCurr: '',
	CadetOath: false,
	AEBookValue: '',
	MileRun: 0,
	ShuttleRun: 0,
	SitAndReach: 0,
	PushUps: 0,
	CurlUps: 0,
	HFZID: 0,
	StaffServiceDate: '1900-01-01T05:00:00.000Z',
	TechnicalWritingAssignment: '',
	TechnicalWritingAssignmentDate: '1900-01-01T05:00:00.000Z',
	OralPresentationDate: '1900-01-01T05:00:00.000Z',
};

export const emptyCadetAchvAprApr: NHQ.CadetAchvAprs = {
	CAPID: 0,
	CadetAchvID: 0,
	Status: 'APR',
	AprCAPID: 0,
	DspReason: '',
	AwardNo: 0,
	JROTCWaiver: false,
	UsrID: '',
	DateMod: '1900-01-01T05:00:00.000Z',
	FirstUsr: '',
	DateCreated: '1900-01-01T05:00:00.000Z',
	PrintedCert: false,
};

export const emptyCadetAchvAprPnd: NHQ.CadetAchvAprs = {
	CAPID: 0,
	CadetAchvID: 0,
	Status: 'PND',
	AprCAPID: 0,
	DspReason: '',
	AwardNo: 0,
	JROTCWaiver: false,
	UsrID: '',
	DateMod: '1900-01-01T05:00:00.000Z',
	FirstUsr: '',
	DateCreated: '1900-01-01T05:00:00.000Z',
	PrintedCert: false,
};

export const emptyCadetPromotionStatus: CadetPromotionStatus = {
	CurrentCadetAchv: emptyCadetAchv,
	CurrentCadetGradeID: 0,
	NextCadetGradeID: 1,
	NextCadetAchvID: 1,
	MaxAprvStatus: 'INC',
	LastAprvDate: Maybe.none(),
	EncampDate: Maybe.none(),
	RCLSDate: Maybe.none(),
	HFZRecord: Maybe.none(),
	oflights: [],
	ges: Maybe.none(),
};
