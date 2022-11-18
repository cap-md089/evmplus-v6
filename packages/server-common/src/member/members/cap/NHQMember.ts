/* eslint-disable jsdoc/check-alignment */
/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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
	CAPIDS AS (SELECT CAPID FROM NHQ_Member WHERE ORGID IN ${bindForArray(
		orgids,
	)} AND doc ->> '$.Type' = 'CADET'),
	LEADTASKS AS (SELECT TaskID FROM NHQ_PL_Tasks WHERE
				doc ->> '$.TaskName' LIKE 'Gen Ira C Eaker - %' OR
				doc ->> '$.TaskName' LIKE 'Gen Carl A Spaatz - %' OR
				doc ->> '$.TaskName' LIKE 'Wright Brothers - %' OR
				doc ->> '$.TaskName' LIKE 'Amelia Earhart - %' OR
				doc ->> '$.TaskName' LIKE 'Billy Mitchell - %' OR
				doc ->> '$.TaskName' LIKE 'Achievement %' OR
				doc ->> '$.TaskName' = 'Accelerated Promotion Waiver'),
	AEROTASKS AS (SELECT TaskID FROM NHQ_PL_Tasks WHERE doc ->> '$.TaskName' IN (
				'Journey of Flight Test 1','Journey of Flight Test 2','Journey of Flight Test 3','Journey of Flight Test 4','Journey of Flight Test 5','Journey of Flight Test 6',
				'Aerospace Dimensions 1','Aerospace Dimensions 2','Aerospace Dimensions 3','Aerospace Dimensions 4','Aerospace Dimensions 5','Aerospace Dimensions 6','Aerospace Dimensions 7')),
	SDATASKS AS (SELECT TaskID FROM NHQ_PL_Tasks WHERE doc ->> '$.TaskName' LIKE 'SDA Technical Writing Assignment'),
	PROMOTIONS AS (SELECT PathID FROM NHQ_PL_Paths WHERE PathID >= 31 AND PathID <= 51),
	LEADRESULTS AS (SELECT MTC.CAPID, MTC.doc ->> '$.Completed' AS 'Completed', T.doc ->> '$.TaskName' AS 'Task', MTC.doc ->> '$.AdditionalOptions' FROM NHQ_PL_MemberTaskCredit MTC
		INNER JOIN NHQ_PL_Tasks T ON MTC.TaskID = T.TaskID
		WHERE
			MTC.CAPID IN (SELECT CAPID FROM CAPIDS) AND
			MTC.TaskID IN (SELECT TaskID FROM LEADTASKS) AND
				MTC.TaskID NOT IN (SELECT TGA.TaskID FROM NHQ_PL_TaskGroupAssignments TGA
						INNER JOIN NHQ_PL_Groups G ON TGA.GroupID = G.GroupID
						INNER JOIN NHQ_PL_Paths P ON G.PathID = P.PathID
						INNER JOIN NHQ_PL_MemberPathCredit MPC ON P.PathID = MPC.PathID
						WHERE MPC.CAPID = MTC.CAPID)),
	AERORESULTS AS (SELECT MTCO.CAPID, MTCO.doc ->> '$.Completed', T.doc ->> '$.TaskName', MTCO.doc ->> '$.AdditionalOptions' FROM NHQ_PL_MemberTaskCredit MTCO
		INNER JOIN NHQ_PL_Tasks T ON MTCO.TaskID = T.TaskID
		WHERE
			MTCO.CAPID IN (SELECT CAPID FROM CAPIDS) AND
			MTCO.MemberTaskCreditID IN (
				SELECT MTC.MemberTaskCreditID FROM NHQ_PL_MemberTaskCredit MTC
						INNER JOIN NHQ_PL_Tasks T on MTC.TaskID = T.TaskID
						WHERE
							MTC.CAPID = MTCO.CAPID AND
								STR_TO_DATE(MTC.doc ->> '$.Completed', '%m/%d/%Y') > (SELECT MAX(STR_TO_DATE(MPC.doc ->> '$.Completed', '%m/%d/%Y')) FROM NHQ_PL_MemberPathCredit MPC
								WHERE
									MPC.CAPID = MTC.CAPID AND
									MPC.PathID IN (SELECT PathID FROM PROMOTIONS)) AND
							MTC.TaskID IN (SELECT TaskID FROM AEROTASKS))
					),
  SDARESULTS AS (SELECT MTCO.CAPID, MTCO.doc ->> '$.Completed', T.doc ->> '$.TaskName', MTCO.doc ->> '$.AdditionalOptions' FROM NHQ_PL_MemberTaskCredit MTCO
    INNER JOIN NHQ_PL_Tasks T ON MTCO.TaskID = T.TaskID
    WHERE
      MTCO.CAPID IN (SELECT CAPID FROM CAPIDS) AND
      MTCO.MemberTaskCreditID IN (
        SELECT MTC.MemberTaskCreditID FROM NHQ_PL_MemberTaskCredit MTC
          INNER JOIN NHQ_PL_Tasks T ON MTC.TaskID = T.TaskID
          WHERE
            MTC.CAPID = MTCO.CAPID AND
              STR_TO_DATE(MTC.doc ->> '$.Completed', '%m/%d/%Y') > (SELECT MAX(STR_TO_DATE(MPC.doc ->> '$.Completed', '%m/%d/%Y')) FROM NHQ_PL_MemberPathCredit MPC
              WHERE
                MPC.CAPID = MTC.CAPID AND
                MPC.PathID IN (SELECT PathID FROM PROMOTIONS)) AND
            MTC.TaskID IN (SELECT TaskID FROM SDATASKS))
        )
(SELECT * FROM LEADRESULTS) UNION (SELECT * FROM AERORESULTS) UNION (SELECT * FROM SDARESULTS) ORDER BY CAPID;`;

const getAchvsSql = (orgids: number[]): string => `\
WITH
	MEMBERS AS (SELECT CAPID FROM NHQ_Member WHERE ORGID IN ${bindForArray(
		orgids,
	)} AND doc ->> '$.Type' = "CADET"),
	HIGHESTACHVAPR AS (SELECT CA.CAPID, 0, JSON_OBJECT('CadetAchvID', CA.CadetAchvID, 'Status', doc ->> '$.Status') FROM NHQ_CadetAchvAprs CA
		INNER JOIN MEMBERS M ON M.CAPID = CA.CAPID
		WHERE (CA.CAPID, CadetAchvID) IN (SELECT CAPID, MAX(CadetAchvID) FROM NHQ_CadetAchvAprs GROUP BY CAPID)),
	HIGHESTACHVUTIL AS (SELECT CA.CAPID, 1, doc, CA.CadetAchvID FROM NHQ_CadetAchv CA
		INNER JOIN MEMBERS M ON M.CAPID = CA.CAPID
		WHERE (CA.CAPID, CadetAchvID) IN (SELECT CAPID, MAX(CadetAchvID) FROM NHQ_CadetAchv GROUP BY CAPID)),
	HIGHESTACHV AS (SELECT CAPID, 1, doc FROM HIGHESTACHVUTIL),
	HIGHESTAPRACHVAPR AS (SELECT CA.CAPID, 2, doc FROM NHQ_CadetAchvAprs CA
		INNER JOIN MEMBERS M ON M.CAPID = CA.CAPID
		WHERE (CA.CAPID, CadetAchvID) IN (SELECT CAPID, MAX(CadetAchvID) FROM NHQ_CadetAchvAprs WHERE doc ->> '$.Status' = "APR" GROUP BY CAPID)),
	HIGHESTPNDACHVAPR AS (SELECT CA.CAPID, 3, doc FROM NHQ_CadetAchvAprs CA
		INNER JOIN MEMBERS M ON M.CAPID = CA.CAPID
		WHERE (CA.CAPID, CadetAchvID) IN (SELECT CAPID, MAX(CadetAchvID) FROM NHQ_CadetAchvAprs WHERE doc ->> '$.Status' = "PND" GROUP BY CAPID)),
	ACTIVITIES AS (SELECT A.CAPID, IF(doc ->> '$.Type' = "ENCAMP", 4, 5), doc -> '$.Completed' FROM NHQ_CadetActivities A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
		WHERE doc ->> '$.Type' IN ("ENCAMP", "RCLS")),
	HFZ AS (SELECT HFZ.CAPID, 6, HFZ.doc FROM NHQ_CadetHFZInformation HFZ
		INNER JOIN MEMBERS M ON M.CAPID = HFZ.CAPID
		INNER JOIN (SELECT HFZI.HFZID FROM NHQ_CadetHFZInformation HFZI
			INNER JOIN HIGHESTACHVUTIL A ON HFZI.CAPID = A.CAPID
			WHERE IF(
				A.CadetAchvID < 4,
				TRUE,
				IF(
					(SELECT COUNT(doc) FROM NHQ_CadetHFZInformation WHERE CAPID = HFZI.CAPID AND doc ->> '$.IsPassed' = 'true') > 0,
					HFZI.doc ->> '$.IsPassed' = 'true',
					TRUE
				)
			)
			ORDER BY HFZID DESC
			LIMIT 1) HFZI2 ON HFZI2.HFZID = HFZ.HFZID),
	GES AS (SELECT A.CAPID, 7, A.doc FROM NHQ_MbrAchievements A
		INNER JOIN MEMBERS M ON M.CAPID = A.CAPID
    WHERE A.AchvID = 53),
	OFLIGHT AS (SELECT O.CAPID, 8, doc FROM NHQ_OFlight O
		INNER JOIN MEMBERS M ON M.CAPID = O.CAPID)
(SELECT * FROM HIGHESTACHVAPR) UNION
(SELECT * FROM HIGHESTACHV) UNION
(SELECT * FROM HIGHESTAPRACHVAPR) UNION
(SELECT * FROM HIGHESTPNDACHVAPR) UNION
(SELECT * FROM ACTIVITIES) UNION
(SELECT * FROM HFZ) UNION
(SELECT * FROM GES) UNION
(SELECT * FROM OFLIGHT);`;

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
	) => CadetPromotionStatus;
}> = [
	{
		matches: /Cadet Interactive Leadership Module \d+$/,
		update: (status, completion, _, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return status;
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
		update: (status, completion, _, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return status;
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
		update: (status, completion, _, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);

			if (!scoreResult) {
				return status;
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
		matches: /Character Forum Participation/,
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
				return status;
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
				return status;
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
		update: (status, completion, task, addtlOpts) => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const scoreResult = addtlOpts.match(/ScoreResult\s*:\s*(\d+)/);
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const twa = addtlOpts.match(/ - (.*)$/);

			if (!scoreResult || !twa) {
				return status;
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
	[_, completion, task, addtlOpts]: [number, string, string, string],
): [CadetPromotionStatus, AchvResultsReducersState] => [
	(promotionResultReducers.find(({ matches }) => matches.test(task))?.update ?? identity)(
		status,
		completion,
		task,
		addtlOpts,
	),
	state,
];

const achvResultsReducers: Array<
	(
		statusState: [status: CadetPromotionStatus, state: AchvResultsReducersState],
		res: any,
	) => [CadetPromotionStatus, AchvResultsReducersState]
> = [
	(
		// maxApproval
		[status, state],
		res,
	) => {
		console.log(res);
		return [
			{
				...status,
				MaxAprvStatus: (res as { Status: CadetAprvStatus }).Status,
			},
			{
				...state,
				maxApproval: res as AchvResultsReducersState['maxApproval'],
			},
		];
	},
	(
		// maxAchv
		[status, state],
		res,
	) => [{ ...status, CurrentCadetAchv: res as NHQ.CadetAchv }, state],
	(
		// maxApprovedApproval
		[status, state],
		res,
	) => {
		const maxApprovedApproval = res as NHQ.CadetAchvAprs;

		console.log(
			maxApprovedApproval.CAPID,
			state.maxApproval?.CadetAchvID,
			maxApprovedApproval.CadetAchvID,
			maxApprovedApproval.CadetAchvID === 0
				? 1
				: state.maxApproval?.CadetAchvID === maxApprovedApproval.CadetAchvID
				? maxApprovedApproval.CadetAchvID + 1
				: maxApprovedApproval.CadetAchvID,
		);

		return [
			{
				...status,
				CurrentCadetGradeID: maxApprovedApproval.CadetAchvID,
				LastAprvDate: Maybe.some(+new Date(maxApprovedApproval.DateMod)),
				NextCadetGradeID:
					state.maxApproval === null
						? 1
						: state.maxApproval.CadetAchvID === maxApprovedApproval.CadetAchvID
						? state.maxApproval.CadetAchvID + 1
						: maxApprovedApproval.CadetAchvID === 0
						? 1
						: state.maxApproval.CadetAchvID,
				NextCadetAchvID:
					maxApprovedApproval.CadetAchvID === 0
						? 1
						: state.maxApproval?.CadetAchvID === maxApprovedApproval.CadetAchvID
						? maxApprovedApproval.CadetAchvID + 1
						: maxApprovedApproval.CadetAchvID,
			},
			{ ...state, maxApprovedApproval },
		];
	},
	(
		// maxPendingApproval
		[status, state],
		res,
	) => {
		const maxPendingApproval = res as NHQ.CadetAchvAprs;

		return [
			{
				...status,
				NextCadetGradeID:
					state.maxApproval === null
						? 1
						: state.maxApproval.CadetAchvID === state.maxApprovedApproval.CadetAchvID
						? state.maxApproval.CadetAchvID + 1
						: state.maxApprovedApproval.CadetAchvID === 0 &&
						  maxPendingApproval.CadetAchvID === 0
						? 1
						: maxPendingApproval.CadetAchvID > 0
						? 23
						: state.maxApproval.CadetAchvID,
			},
			state,
		];
	},
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
		.map(([plResults, achvResults]) => {
			const plResultsArr = plResults.fetchAll();
			const achvResultsArr = achvResults.fetchAll();
			// console.log(plResultsArr.length, achvResultsArr.length);
			// console.log(plResultsArr);

			return plResultsArr.reduce(
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
				achvResultsArr.reduce(
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
			);
		})
		.map(
			results =>
				Object.fromEntries(
					Object.entries(results).map(([key, value]) => [key, value[0]]),
				) as { [CAPID: number]: CadetPromotionStatus },
		);

export const getCadetPromotionRequirements = (schema: Schema) => (
	member: CAPNHQMemberObject,
): ServerEither<CadetPromotionStatus> =>
	member.seniorMember
		? asyncLeft<ServerError, CadetPromotionStatus>({
				type: 'OTHER',
				code: 400,
				message: 'Cannot get promotion requirements for a senior member',
		  })
		: asyncRight(
				Promise.all([
					collectResults(
						findAndBind(schema.getCollection<NHQ.CadetAchv>('NHQ_CadetAchv'), {
							CAPID: member.id,
						})
							.sort('CadetAchvID DESC')
							.limit(1),
					),
					collectResults(
						findAndBind(schema.getCollection<NHQ.CadetAchvAprs>('NHQ_CadetAchvAprs'), {
							CAPID: member.id,
							Status: 'APR',
						})
							.sort('CadetAchvID DESC')
							.limit(1),
					),
					collectResults(
						findAndBind(schema.getCollection<NHQ.CadetAchvAprs>('NHQ_CadetAchvAprs'), {
							CAPID: member.id,
							Status: 'PND',
						})
							.sort('CadetAchvID DESC')
							.limit(1),
					),
					collectResults(
						findAndBind(schema.getCollection<NHQ.CadetAchvAprs>('NHQ_CadetAchvAprs'), {
							CAPID: member.id,
						})
							.sort('CadetAchvID DESC')
							.limit(1),
					),
					collectResults(
						findAndBind(
							schema.getCollection<NHQ.CadetActivities>('NHQ_CadetActivities'),
							{
								CAPID: member.id,
								Type: 'ENCAMP',
							},
						),
					),
					collectResults(
						findAndBind(
							schema.getCollection<NHQ.CadetActivities>('NHQ_CadetActivities'),
							{
								CAPID: member.id,
								Type: 'RCLS',
							},
						),
					),
					collectResults(
						findAndBind(
							schema.getCollection<NHQ.CadetHFZInformation>(
								'NHQ_CadetHFZInformation',
							),
							{
								CAPID: member.id,
							},
						).sort('HFZID DESC'),
					),
					collectResults(
						findAndBind(
							schema.getCollection<NHQ.MbrAchievements>('NHQ_MbrAchievements'),
							{
								CAPID: member.id,
								AchvID: 53,
							},
						),
					),
					collectResults(
						findAndBind(schema.getCollection<NHQ.OFlight>('NHQ_OFlight'), {
							CAPID: member.id,
						}),
					),
				]),
				errorGenerator('Could not load promotion requirements'),
		  )
				.map(
					([
						maxAchv,
						maxApprovedApproval,
						maxPendingApproval,
						maxApproval,
						encampResults,
						rclsResults,
						HFZ,
						ges,
						oflights,
					]) =>
						[
							maxAchv.length === 1
								? maxAchv[0]
								: { ...emptyCadetAchv, CAPID: member.id },
							maxApprovedApproval.length === 1
								? maxApprovedApproval[0]
								: { ...emptyCadetAchvAprApr, CAPID: member.id },
							maxPendingApproval.length === 1
								? maxPendingApproval[0]
								: { ...emptyCadetAchvAprPnd, CAPID: member.id },
							maxApproval,
							encampResults,
							rclsResults,
							HFZ,
							ges,
							oflights,
						] as const,
				)
				/**
				 * NextCadetAchvID - The CadetAchvEnum associated with the achievement elements
				 * 		the cadet needs to perform for their next promotion
				 * CurrentCadetAchv - The current CadetAchvEnum for the cadet's present grade
				 * CurrentAprvStatus - PND?
				 *
				 * States:
				 * Brand new cadet - No achievement records
				 * Partial achievement record = CadetAchv record and a CadetAchvAprs INC record at the cadet's next grade
				 * Complete achievement record = CadetAchv record and a CadetAchvAprs PND record at the cadet's next grade - Leadership locked
				 * Approved achievement record = CadetAchv record and a CadetAchvAprs APR record at the cadet's next grade - Leadership unlocked
				 *
				 */
				.map<CadetPromotionStatus>(
					([
						maxAchv,
						maxApprovedApproval,
						maxPendingApproval,
						maxApproval,
						encampResults,
						rclsResults,
						HFZ,
						ges,
						oflights,
					]) => ({
						CurrentCadetAchv: maxAchv, // this is the achievement the cadet is pursuing (next higher grade)
						CurrentCadetGradeID: maxApprovedApproval.CadetAchvID,
						// NextCadetGradeID: 1 === 1 ? 1 : maxPendingApproval.CadetAchvID,
						NextCadetGradeID:
							maxApproval.length !== 1
								? 1
								: maxApproval[0]?.CadetAchvID === maxApprovedApproval.CadetAchvID
								? maxApproval[0]?.CadetAchvID + 1
								: maxApprovedApproval.CadetAchvID === 0 &&
								  maxPendingApproval.CadetAchvID === 0
								? 1
								: maxPendingApproval.CadetAchvID > 0
								? 23
								: maxApproval[0]?.CadetAchvID,
						// NextCadetAchvID: 2,
						NextCadetAchvID:
							maxApprovedApproval.CadetAchvID === 0
								? 1
								: maxApproval[0]?.CadetAchvID === maxApprovedApproval.CadetAchvID
								? maxApproval[0]?.CadetAchvID + 1
								: maxApproval[0]?.CadetAchvID,
						MaxAprvStatus: maxApproval[0]?.Status ?? 'INC', // this is the approval status for the next achivement the cadet is pursuing
						LastAprvDate: Maybe.map<NHQ.CadetAchvAprs, number>(
							aprv => +new Date(aprv.DateMod),
						)(Maybe.fromValue(maxApprovedApproval)),
						EncampDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromValue(encampResults[0])),
						RCLSDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromValue(rclsResults[0])),
						HFZRecord: Maybe.fromValue(
							maxAchv.CadetAchvID < 4
								? HFZ[0]
								: HFZ.find(record => record.IsPassed) ?? HFZ[0],
						),
						ges: Maybe.fromValue(ges[0]),
						oflights,
					}),
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
	NextCadetGradeID: 0,
	NextCadetAchvID: 0,
	MaxAprvStatus: 'INC',
	LastAprvDate: Maybe.none(),
	EncampDate: Maybe.none(),
	RCLSDate: Maybe.none(),
	HFZRecord: Maybe.none(),
	oflights: [],
	ges: Maybe.none(),
};
