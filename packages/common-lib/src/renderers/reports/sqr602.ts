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
	CadetPromotionRequirementsMap,
	CadetPromotionStatus,
	get,
	Maybe,
	RegistryValues,
} from '../..';
import { PromotionRequrementsItem } from '../../typings/apis/member/promotionrequirements';

export const sqr602DocumentDefinition = (
	nhqmembers: PromotionRequrementsItem[],
	registry: RegistryValues,
): TDocumentDefinitions => {
	const myTitleFontSize = 10;
	const mySmallFontSize = 7;

	function sortNHQName(a: PromotionRequrementsItem, b: PromotionRequrementsItem): number {
		const aName = a.member.nameLast + ', ' + a.member.nameFirst;
		const bName = b.member.nameLast + ', ' + b.member.nameFirst;
		return aName.localeCompare(bName);
	}

	// function sortProspectiveName(
	// 	a: CAPProspectiveMemberObject,
	// 	b: CAPProspectiveMemberObject,
	// ): number {
	// 	const aName = a.nameLast + ', ' + a.nameFirst;
	// 	const bName = b.nameLast + ', ' + b.nameFirst;
	// 	return aName.localeCompare(bName);
	// }

	// const allMembers = nhqmembers.map()

	const getHFZExpire = (reqs: CadetPromotionStatus): string =>
		pipe(
			get<CadetPromotionStatus, 'HFZRecord'>('HFZRecord'),
			Maybe.filter(({ IsPassed }) => IsPassed || reqs.CurrentCadetAchv.CadetAchvID < 4),
			Maybe.map(({ DateTaken }) => DateTaken.substr(0, 10)),
			Maybe.map(s => +new Date(s) + 182 * 24 * 60 * 60 * 1000),
			Maybe.map(s => new Date(s).toLocaleDateString('en-US')),
			Maybe.orSome(''),
		)(reqs);

	// function ageCalc(birthday: string): number {
	// 	const birthdate = new Date(birthday).getTime();
	// 	const todate = new Date().getTime();

	// 	return Math.floor((todate - birthdate) / (1000 * 60 * 60 * 24 * 365 ));
	// }

	// const tableHeaders: TableCell = [
	// 	{
	// 		text: 'CAPID',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Full Name',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'HFZ Expire Date',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Pacer Req.',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Pacer Score',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Mile Run Req.',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Mile Run Score',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Curl Up Req.',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Curl Up Score',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Push Up Req.',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Push Up Score',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Sit Reach Req.',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// 	{
	// 		text: 'Sit Reach Score',
	// 		fontSize: mySmallFontSize,
	// 		bold: true,
	// 		alignment: 'left',
	// 	},
	// ];

	const fullMembers = nhqmembers.sort(sortNHQName).map((loopmember): TableCell[] => [
		{
			// CAPID
			text: loopmember.member.id,
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'left',
		},
		{
			// Full Name
			text:
				CadetPromotionRequirementsMap[loopmember.requirements.CurrentCadetGradeID].Grade +
				' ' +
				loopmember.member.nameLast +
				', ' +
				loopmember.member.nameFirst,
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
			alignment: 'left',
		},
		{
			// Pacer required
			text: CadetHFZRequirementsMap.find(function (hfzentry) {
				if (
					hfzentry.Gender === loopmember.member.gender &&
					hfzentry.Age ===
						Math.floor(
							(new Date().getTime() - loopmember.member.dateOfBirth) /
								(1000 * 60 * 60 * 24 * 365),
						)
				) {
					return true;
				}
			})?.Pacer,
			// text: Math.floor((new Date().getTime() - loopmember.member.joined) / (1000 * 60 * 60 * 24 * 365 )),
			fontSize: mySmallFontSize,
			bold: false,
			alignment: 'left',
		},
	]);

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
												text: 'Squadron Report 60-2 Oct 2021',
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
				text: ' ',
				alignment: 'left',
				fontSize: mySmallFontSize,
				bold: true,
			},
			{
				text: 'Prospective Members',
				alignment: 'left',
				fontSize: myTitleFontSize,
				bold: true,
			},
			{
				// table start
				table: {
					// table def start
					headerRows: 1,
					widths: [
						24, // CAPID
						80, // Full Name
						70, // HFZ Expire Date
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
					body: [
						[
							// row 1
						], // data rows
						// ...tableHeaders,
						...fullMembers,
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
