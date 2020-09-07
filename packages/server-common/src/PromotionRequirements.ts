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

import { Schema } from '@mysql/xdevapi';
import {
	asyncLeft,
	asyncRight,
	CadetPromotionStatus,
	CAPNHQMemberObject,
	errorGenerator,
	Maybe,
	NHQ,
	ServerError,
} from 'common-lib';
import { collectResults, findAndBind } from './MySQLUtil';

// need to have functions to return single cadet or all cadets for an account

export const getCadetPromotionRequirements = (schema: Schema) => (member: CAPNHQMemberObject) =>
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
				]),
				errorGenerator('Could not load promotion requirements'),
		  )
				.map(
					([maxAchv, maxAprv, maxAprvStatus, encampResults, rclsResults]) =>
						[
							maxAchv.length === 1
								? maxAchv[0]
								: { ...emptyCadetAchv, CAPID: member.id },
							maxAprv,
							maxAprvStatus[0].Status,
							encampResults,
							rclsResults,
						] as const,
				)
				.map<CadetPromotionStatus>(
					([maxAchv, maxAprv, maxAprvStatus, encampResults, rclsResults]) => ({
						NextCadetAchvID:
							maxAprv.length !== 1 ? 0 : Math.min(21, maxAprv[0].CadetAchvID + 1),
						CurrentCadetAchv: maxAchv,
						CurrentAprvStatus: maxAprvStatus,
						LastAprvDate: Maybe.map<NHQ.CadetAchvAprs, number>(
							aprv => +new Date(aprv.DateMod),
						)(Maybe.fromArray(maxAprv)),
						EncampDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromArray(encampResults)),
						RCLSDate: Maybe.map<NHQ.CadetActivities, number>(
							acti => +new Date(acti.Completed),
						)(Maybe.fromArray(rclsResults)),
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
	ActivePart: 0,
	OtherReq: 0,
	SDAReport: 0,
	UsrID: '',
	DateMod: '1900-01-01T05:00:00.000Z',
	FirstUsr: '',
	DateCreated: '1900-01-01T05:00:00.000Z',
	DrillDate: '1900-01-01T05:00:00.000Z',
	DrillScore: 0,
	LeadCurr: '',
	CadetOath: 0,
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
