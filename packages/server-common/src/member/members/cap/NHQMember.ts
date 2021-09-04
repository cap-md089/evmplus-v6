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
	asyncLeft,
	asyncRight,
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
						)
							.sort('HFZID DESC')
							.limit(1),
					),
				]),
				errorGenerator('Could not load promotion requirements'),
		  )
				.map(
					([
						maxAchv,
						maxApprovedApproval,
						maxApproval,
						encampResults,
						rclsResults,
						lastHFZRecord,
					]) =>
						[
							maxAchv.length === 1
								? maxAchv[0]
								: { ...emptyCadetAchv, CAPID: member.id },
							maxApprovedApproval,
							maxApproval,
							encampResults,
							rclsResults,
							lastHFZRecord.length === 1
								? lastHFZRecord[0]
								: { ...emptyHFZID, CAPID: member.id },
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
						maxApproval,
						encampResults,
						rclsResults,
						lastHFZRecord,
					]) => ({
						NextCadetAchvID:
							maxApprovedApproval.length !== 1
								? 1
								: Math.min(21, maxApprovedApproval[0].CadetAchvID + 1),
						CurrentCadetAchv: maxAchv, // this is the next achievement the cadet is pursuing
						MaxAprvStatus: maxApproval[0]?.Status ?? 'INC', // this is the approval status for the next achivement the cadet is pursuing
						LastAprvDate: Maybe.map<NHQ.CadetAchvAprs, number>(
							aprv => +new Date(aprv.DateMod),
						)(Maybe.fromValue(maxApprovedApproval[0])),
						EncampDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromValue(encampResults[0])),
						RCLSDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromValue(rclsResults[0])),
						HFZRecord: lastHFZRecord,
					}),
				);

export const emptyHFZID: NHQ.CadetHFZInformation = {
	CAPID: 0,
	CurlUp: '0',
	CurlUpPassed: 'n/a',
	CurlUpWaiver: false,
	DateTaken: '1900-01-01T05:00:00.000Z',
	HFZID: 1,
	IsPassed: false,
	MileRun: '0:0',
	MileRunPassed: 'n/a',
	MileRunWaiver: false,
	ORGID: 0,
	PacerRun: '0:0',
	PacerRunPassed: 'n/a',
	PacerRunWaiver: false,
	SitAndReach: '0',
	SitAndReachPassed: 'n/a',
	SitAndReachWaiver: false,
	WeatherWaiver: false,
};

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
