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

import { DateTime } from 'luxon';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { pipe } from 'ramda';
import {
	// CadetHFZRequirements,
	CadetHFZRequirementsMap,
	// CadetPromotionRequirements,
	CadetPromotionStatus,
	CAPNHQMemberObject,
	CAPProspectiveMemberObject,
	CAPMember,
	get,
	Maybe,
	memoize,
	RegistryValues,
} from '../..';
import { PromotionRequirementsItem } from '../../typings/apis/member/promotionrequirements';

const getPromotionRequirementsForMember = memoize(
	(loopmember: CombinedPromotionRequirementsItem) =>
		loopmember.member.type === 'CAPProspectiveMember'
			? undefined
			: CadetHFZRequirementsMap.find(
					hfzentry =>
						hfzentry.Gender === (loopmember.member as CAPNHQMemberObject).gender &&
						hfzentry.Age ===
							(Math.floor(
								(new Date().getTime() -
									(loopmember.member as CAPNHQMemberObject).dateOfBirth) /
									(1000 * 60 * 60 * 24 * 365),
							) > 18
								? 18
								: Math.floor(
										(new Date().getTime() -
											(loopmember.member as CAPNHQMemberObject).dateOfBirth) /
											(1000 * 60 * 60 * 24 * 365),
								  )),
			  ),
	requirements => requirements.member.id,
);

interface CombinedPromotionRequirementsItem {
	requirements: PromotionRequirementsItem['requirements'] | null;
	member: CAPMember;
}

export const sqr6020DocumentDefinition = (
	nhqmembers: PromotionRequirementsItem[],
	prospectiveMembers: CAPProspectiveMemberObject[],
	registry: RegistryValues,
): TDocumentDefinitions => {
	const myTitleFontSize = 10;
	const mySmallFontSize = 7;

	const sortByMemberName = (
		a: CAPMember | PromotionRequirementsItem,
		b: CAPMember | PromotionRequirementsItem,
	): number => {
		const aMember = 'member' in a ? a.member : a;
		const bMember = 'member' in b ? b.member : b;
		return `${aMember.nameLast}, ${aMember.nameFirst}`.localeCompare(
			`${bMember.nameLast}, ${bMember.nameFirst}`,
		);
	};

	function sortNHQName(a: PromotionRequirementsItem, b: PromotionRequirementsItem): number {
		const aName = a.member.nameLast + ', ' + a.member.nameFirst;
		const bName = b.member.nameLast + ', ' + b.member.nameFirst;
		return aName.localeCompare(bName);
	}

	const getHFZExpire = (reqs: CadetPromotionStatus): string =>
		pipe(
			get<CadetPromotionStatus, 'HFZRecord'>('HFZRecord'),
			Maybe.filter(({ IsPassed }) => IsPassed || reqs.CurrentCadetAchv.CadetAchvID < 4),
			Maybe.map(({ DateTaken }) => DateTaken.substr(0, 10)),
			Maybe.map(s => +new Date(s) + 182 * 24 * 60 * 60 * 1000),
			Maybe.map(s => new Date(s).toLocaleDateString('en-US')),
			Maybe.orSome(''),
		)(reqs);

	const daysInMonth = (month: number, year: number): number => new Date(year, month, 0).getDate();

	function getNextMonth(): Date {
		const today = new Date();
		const thisMonth = today.getMonth();
		const nextMonth = (thisMonth + 2) % 12;
		return new Date(
			nextMonth.toString() +
				'/' +
				daysInMonth(today.getFullYear(), nextMonth).toString() +
				'/' +
				today.getFullYear().toString(),
		);
	}

	const phase1Cadets = nhqmembers.filter(
		memberItem => memberItem.requirements.CurrentCadetAchv.CadetAchvID < 4,
	);
	const phase234CadetsThatNeedPT = nhqmembers.filter(
		memberItem =>
			memberItem.requirements.CurrentCadetAchv.CadetAchvID >= 4 &&
			new Date(getHFZExpire(memberItem.requirements)).getTime() < getNextMonth().getTime(),
	);
	const phase234CadetsThatDontNeedPT = nhqmembers.filter(
		memberItem =>
			memberItem.requirements.CurrentCadetAchv.CadetAchvID >= 4 &&
			new Date(getHFZExpire(memberItem.requirements)).getTime() > getNextMonth().getTime(),
	);

	const tableHeaders1: TableCell[] = [
		{
			text: 'CAPID',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Full Name',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'HFZ Expire Date',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Pacer Req.',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Pacer Score',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Mile Run Req.',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Mile Run Score',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Curl Up Req.',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Curl Up Score',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Push Up Req.',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Push Up Score',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Sit Reach Req.',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
		{
			text: 'Sit Reach Score',
			fontSize: mySmallFontSize,
			bold: true,
			alignment: 'left',
		},
	];

	const copyObject = <T>(obj: T): T => ({ ...obj });

	const tableHeaders2 = tableHeaders1.map(copyObject);
	const tableHeaders3 = tableHeaders1.map(copyObject);

	const mapFunc = (loopmember: PromotionRequirementsItem): TableCell[] => [
		{
			// CAPID
			text: loopmember.member.id,
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'left',
		},
		{
			// Full Name
			text: `${loopmember.member.memberRank} ${loopmember.member.nameLast} ${loopmember.member.nameFirst}`,
			fontSize: mySmallFontSize,
			bold: false,
			decoration:
				new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
					new Date().getTime() <=
				0
					? 'lineThrough'
					: '',
			alignment: 'left',
		},
		{
			// HFZ credit expiration date
			text: getHFZExpire(loopmember.requirements),
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Pacer required
			text: getPromotionRequirementsForMember(loopmember)?.Pacer ?? '',
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Pacer Score
			text: '',
			fontSize: mySmallFontSize,
		},
		{
			// Mile Run Req
			text: getPromotionRequirementsForMember(loopmember)?.MileRun ?? '',
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Mile Run Score
			text: '',
			fontSize: mySmallFontSize,
		},
		{
			// Curl Up Req
			text: getPromotionRequirementsForMember(loopmember)?.CurlUps ?? '',
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Curl Up Score
			text: '',
			fontSize: mySmallFontSize,
		},
		{
			// Push Up Req
			text: getPromotionRequirementsForMember(loopmember)?.PushUps ?? '',
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Push Up Score
			text: '',
			fontSize: mySmallFontSize,
		},
		{
			// Sit Reach Req
			text: getPromotionRequirementsForMember(loopmember)?.SitReach ?? '',
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'right',
		},
		{
			// Sit Reach Score
			text: '',
			fontSize: mySmallFontSize,
		},
	];

	const phase1CadetsDoc = [
		...phase1Cadets,
		...prospectiveMembers.filter(mem => mem.memberRank === 'CADET'),
	]
		.sort(sortByMemberName)
		.map((mem): {
			requirements: PromotionRequirementsItem['requirements'] | null;
			member: CAPMember;
		} => ({
			requirements: 'requirements' in mem ? mem.requirements : null,
			member: 'member' in mem ? mem.member : mem,
		}))
		.map((loopmember): TableCell[] => [
			{
				// CAPID
				text: loopmember.member.id,
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'left',
			},
			{
				// Full Name
				text: `${loopmember.member.memberRank} ${loopmember.member.nameLast} ${loopmember.member.nameFirst}`,
				fontSize: mySmallFontSize,
				bold: false,
				decoration:
					loopmember.member.type === 'CAPNHQMember' &&
					new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
						new Date().getTime() <=
						0
						? 'lineThrough'
						: '',
				alignment: 'left',
			},
			{
				// HFZ credit expiration date
				text: loopmember.requirements !== null ? getHFZExpire(loopmember.requirements) : '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Pacer required
				text: getPromotionRequirementsForMember(loopmember)?.Pacer ?? '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Pacer Score
				text: '',
				fontSize: mySmallFontSize,
			},
			{
				// Mile Run Req
				text: getPromotionRequirementsForMember(loopmember)?.MileRun ?? '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Mile Run Score
				text: '',
				fontSize: mySmallFontSize,
			},
			{
				// Curl Up Req
				text: getPromotionRequirementsForMember(loopmember)?.CurlUps ?? '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Curl Up Score
				text: '',
				fontSize: mySmallFontSize,
			},
			{
				// Push Up Req
				text: getPromotionRequirementsForMember(loopmember)?.PushUps ?? '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Push Up Score
				text: '',
				fontSize: mySmallFontSize,
			},
			{
				// Sit Reach Req
				text: getPromotionRequirementsForMember(loopmember)?.SitReach ?? '',
				fontSize: mySmallFontSize,
				bold: false,
				alignment: 'right',
			},
			{
				// Sit Reach Score
				text: '',
				fontSize: mySmallFontSize,
			},
		]);
	const phase1CadetsDocTable: Content =
		phase1CadetsDoc.length === 0
			? {
					// empty table message here
					text: 'There are no Phase 1 Cadets in this unit.',
					fontSize: myTitleFontSize - 2,
					bold: true,
					alignment: 'left',
			  }
			: {
					// table start
					table: {
						// table def start
						headerRows: 1,
						widths: [
							34, // CAPID
							95, // Full Name
							36, // HFZ Expire Date
							29, // Pacer Req
							29, // Pacer Score
							29, // Mile Run Req
							29, // Mile Run Score
							29, // Curl Up Req
							29, // Curl Up Score
							29, // Push Up Req
							29, // Push Up Score
							29, // Sit Reach Req
							29, // Sit Reach Score
						],
						body: [tableHeaders1, ...phase1CadetsDoc],
					}, // table def end
					layout: {
						fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
					}, // table layout end
			  };

	const phase234CadetsExpiringDoc = phase234CadetsThatNeedPT.sort(sortNHQName).map(mapFunc);
	const phase234CadetsExpiringDocTable: Content =
		phase234CadetsExpiringDoc.length === 0
			? {
					// empty table message here
					text: 'There are no Phase 2-4 Cadets with expiring PT',
					fontSize: myTitleFontSize - 2,
					bold: true,
					alignment: 'left',
			  }
			: {
					// table start
					table: {
						// table def start
						headerRows: 1,
						widths: [
							24, // CAPID
							95, // Full Name
							36, // HFZ Expire Date
							29, // Pacer Req
							29, // Pacer Score
							29, // Mile Run Req
							29, // Mile Run Score
							29, // Curl Up Req
							29, // Curl Up Score
							29, // Push Up Req
							29, // Push Up Score
							29, // Sit Reach Req
							29, // Sit Reach Score
						],
						body: [tableHeaders2, ...phase234CadetsExpiringDoc],
					}, // table def end
					layout: {
						fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
					}, // table layout end
			  };

	const phase234CadetsNotExpiringDoc = phase234CadetsThatDontNeedPT
		.sort(sortNHQName)
		.map(mapFunc);
	const phase234CadetsNotExpiringDocTable: Content =
		phase234CadetsNotExpiringDoc.length === 0
			? {
					// empty table message here
					text: 'There are no Phase 2-4 Cadets without expiring PT',
					fontSize: myTitleFontSize - 2,
					bold: true,
					alignment: 'left',
			  }
			: {
					// table start
					table: {
						// table def start
						headerRows: 1,
						widths: [
							24, // CAPID
							95, // Full Name
							36, // HFZ Expire Date
							29, // Pacer Req
							29, // Pacer Score
							29, // Mile Run Req
							29, // Mile Run Score
							29, // Curl Up Req
							29, // Curl Up Score
							29, // Push Up Req
							29, // Push Up Score
							29, // Sit Reach Req
							29, // Sit Reach Score
						],
						body: [tableHeaders3, ...phase234CadetsNotExpiringDoc],
					}, // table def end
					layout: {
						fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
					}, // table layout end
			  };

	const nowDate = DateTime.utc();
	const docDefinition: TDocumentDefinitions = {
		pageSize: 'LETTER',
		pageOrientation: 'landscape',
		pageMargins: [25, 40, 64, 40],

		header: {
			text:
				registry.Website.Name +
				' Cadet HFZ Status Report: ' +
				nhqmembers.length.toString() +
				' members',
			alignment: 'left',
			fontSize: myTitleFontSize,
			bold: true,
			margin: [30, 20, 40, 35],
		},

		footer: (currentPage: number, pageCount: number): Content => [
			{
				layout: 'noBorders',
				table: {
					widths: [792 - 72],
					headerRows: 0,
					body: [
						[
							{
								layout: 'noBorders',
								table: {
									widths: ['*', 306, '*'],
									headerRows: 0,
									body: [
										[
											{
												text: 'Squadron Report 60-20 Oct 2021',
												bold: true,
												fontSize: mySmallFontSize,
											},
											{
												text: `Generated by Event Manager on ${
													nowDate.toLocaleString({
														year: 'numeric',
														month: '2-digit',
														day: '2-digit',
													}) ?? ''
												}`,
												bold: false,
												fontSize: mySmallFontSize,
												alignment: 'center',
											},
											{
												text: `Page ${currentPage} of ${pageCount}`,
												bold: false,
												fontSize: mySmallFontSize,
												alignment: 'right',
											},
										],
									],
								},
							},
						],
					],
				},
				margin: [30, 0, 0, 60],
			},
		],

		content: [
			// content array start
			{
				text: 'Phase 1 Cadets',
				alignment: 'left',
				fontSize: myTitleFontSize - 1,
				bold: true,
			},
			phase1CadetsDocTable,
			{
				text: ' ',
				alignment: 'left',
				fontSize: mySmallFontSize,
				bold: true,
			},
			{
				text:
					'Phase 2-4 Cadets whose HFZ credit expires before ' +
					getNextMonth().toLocaleDateString(),
				alignment: 'left',
				fontSize: myTitleFontSize - 1,
				bold: true,
			},
			phase234CadetsExpiringDocTable,
			{
				text: ' ',
				alignment: 'left',
				fontSize: mySmallFontSize,
				bold: true,
			},
			{
				text: 'Phase 2-4 Cadets whose HFZ credit is not expiring',
				alignment: 'left',
				fontSize: myTitleFontSize - 1,
				bold: true,
			},
			phase234CadetsNotExpiringDocTable,
			{
				text: ' ',
				alignment: 'left',
				fontSize: mySmallFontSize,
				bold: true,
				pageBreak: 'before',
			},
			{
				text: 'Healthy Fitness Zone Standards',
				alignment: 'left',
				fontSize: myTitleFontSize,
				bold: true,
			},
			{
				text: 'Males',
				alignment: 'left',
				fontSize: myTitleFontSize - 2,
				bold: true,
			},
			{
				// table start
				table: {
					// table def start
					headerRows: 1,
					widths: [
						32, // Gender
						32, // Age
						32, // Pacer Req
						32, // Mile Run Req
						32, // Curl Up Req
						36, // Push Up Req
						36, // Sit Reach Req
					],
					body: [
						[
							{
								text: 'Age',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Pacer',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Mile Run',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Curl Ups',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Push Ups',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Sit Reach',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
						], // header row
						...CadetHFZRequirementsMap.filter(({ Gender }) => Gender === 'MALE').map(
							requirements => [
								{
									text: `${requirements.Age}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.Pacer}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.MileRun}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.CurlUps}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.PushUps}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.SitReach}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
							],
						),
					],
				}, // table def end
				layout: {
					fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
				}, // table layout end
			}, // table end
			{
				text: ' ',
				alignment: 'left',
				fontSize: mySmallFontSize,
				bold: true,
			},
			{
				text: 'Females',
				alignment: 'left',
				fontSize: myTitleFontSize - 2,
				bold: true,
			},
			{
				// table start
				table: {
					// table def start
					headerRows: 1,
					widths: [
						32, // Gender
						32, // Age
						32, // Pacer Req
						32, // Mile Run Req
						32, // Curl Up Req
						36, // Push Up Req
						36, // Sit Reach Req
					],
					body: [
						[
							{
								text: 'Age',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Pacer',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Mile Run',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Curl Ups',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Push Ups',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
							{
								text: 'Sit Reach',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'center',
							},
						], // header row
						...CadetHFZRequirementsMap.filter(({ Gender }) => Gender === 'FEMALE').map(
							requirements => [
								{
									text: `${requirements.Age}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.Pacer}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.MileRun}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.CurlUps}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.PushUps}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text: `${requirements.SitReach}`,
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
							],
						),
					],
				}, // table def end
				layout: {
					fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
				}, // table layout end
			}, // table end
		], // content array end
		defaultStyle: {
			font: 'FreeSans',
		},
	}; // doc def end

	return docDefinition;
};
// http://localhost:3001/api/event/2/attendance/log
