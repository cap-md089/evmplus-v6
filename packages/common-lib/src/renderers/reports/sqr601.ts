/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
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
import {
	CadetPromotionRequirements,
	CadetPromotionRequirementsMap,
	CAPProspectiveMemberObject,
	Maybe,
} from '../..';
import { PromotionRequrementsItem } from '../../typings/apis/member/promotionrequirements';
// import type { Content, ContentCanvas, TDocumentDefinitions } from 'pdfmake/interfaces';
// import { Maybe } from '../../lib/Maybe';
// import {
// 	EventStatus,
// 	FullPointOfContact,
// 	Member,
// 	RawResolvedEventObject,
// } from '../../typings/types';

// const zeroPad = (n: number, a = 2): string => `00${n}`.substr(-a);

// const formatDate = (date: number): string => {
// 	const dateObject = new Date(date);

// 	const hour = dateObject.getHours();
// 	const minute = dateObject.getMinutes();

// 	const day = dateObject.getDate();
// 	const month = dateObject.getMonth();
// 	const year = dateObject.getFullYear();

// 	return `${zeroPad(month + 1)}/${zeroPad(day)}/${year} at ${zeroPad(hour)}:${zeroPad(minute)}`;
// };

// const boxChecked = (boxSize: number, vOffset: number): ContentCanvas => ({
// 	canvas: [
// 		{ type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' },
// 		{
// 			type: 'line',
// 			x1: 0,
// 			y1: vOffset,
// 			x2: boxSize,
// 			y2: boxSize + vOffset,
// 			lineColor: 'black',
// 		},
// 		{
// 			type: 'line',
// 			x1: 0,
// 			y1: boxSize + vOffset,
// 			x2: boxSize,
// 			y2: vOffset,
// 			lineColor: 'black',
// 		},
// 	],
// });

// const boxUnchecked = (boxSize: number, vOffset: number): ContentCanvas => ({
// 	canvas: [{ type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' }],
// });

export const sqr601DocumentDefinition = (
	nhqmembers: PromotionRequrementsItem[],
	newmembers: CAPProspectiveMemberObject[], // cadets: PromotionRequrementsItem[],
	// member: Member,
): TDocumentDefinitions => {
	// const MemberName = member.seniorMember
	// 	? ''
	// 	: member.memberRank + ' ' + member.nameFirst + ' ' + member.nameLast;

	const myTest = true;
	const myTitleFontSize = 10;
	// const myTextFontSize = 9;
	const mySmallFontSize = 7;
	// const boxSize = 8;
	// const vOffset = myTextFontSize - boxSize;
	// const getBox = (checked = false): ContentCanvas =>
	// 	(checked ? boxChecked : boxUnchecked)(boxSize, vOffset);

	const newmem = newmembers.length > 0 ? 'non-zero' : 'zero';

	function sortName(a: PromotionRequrementsItem, b: PromotionRequrementsItem): number {
		const aName = a.member.nameLast + ', ' + a.member.nameFirst;
		const bName = b.member.nameLast + ', ' + a.member.nameFirst;
		return aName.localeCompare(bName);
	}

	// SDAService: false,
	// SDAWriting: false,
	// SDAPresentation: false,

	function determineSDA(
		member: PromotionRequrementsItem,
		requirements: CadetPromotionRequirements,
	): string {
		let req = 0;
		let reqComp = 0;
		let compDate = new Date('01/01/2010').toLocaleDateString('en-US');
		const recentDate = new Date('01/01/2010');
		const reqs = [];
		reqs.push({
			required: requirements.SDAService,
			completionDate: new Date(member.requirements.CurrentCadetAchv.StaffServiceDate),
		});
		reqs.push({
			required: requirements.SDAWriting,
			completionDate: new Date(
				member.requirements.CurrentCadetAchv.TechnicalWritingAssignmentDate,
			),
		});
		reqs.push({
			required: requirements.SDAPresentation,
			completionDate: new Date(member.requirements.CurrentCadetAchv.OralPresentationDate),
		});

		for (let i = 0; i < 3; i++) {
			if (reqs[i].required) {
				req++;
				if (reqs[i].completionDate.getTime() > recentDate.getTime()) {
					reqComp++;
					if (reqs[i].completionDate.getTime() > new Date(compDate).getTime()) {
						compDate = new Date(reqs[i].completionDate).toLocaleDateString('en-US');
					}
				}
			}
		}

		if (req === 0) {
			return 'N/A';
		} else if (req > reqComp) {
			return 'Incomplete';
		} else {
			return compDate;
		}
	}

	const myFill = myTest
		? nhqmembers.sort(sortName).map((loopmember): TableCell[] => [
				{
					text: loopmember.member.memberRank,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: loopmember.member.nameLast + ', ' + loopmember.member.nameFirst,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: loopmember.member.id,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: loopmember.member.flight,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
							new Date().getTime() <=
						0
							? 'Y'
							: new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
									new Date().getTime() <=
							  60 * 60 * 24 * 30 * 1000
							? '<'
							: '',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: Maybe.isSome(loopmember.requirements.LastAprvDate)
						? new Date(
								loopmember.requirements.LastAprvDate.value +
									60 * 60 * 24 * 56 * 1000,
						  ).toLocaleDateString('en-US')
						: '',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Grade,
					fontSize: mySmallFontSize,
					bold: false,
					alighment: 'left',
				},
				{
					text:
						new Date(loopmember.requirements.CurrentCadetAchv.LeadLabDateP).getTime() -
							new Date('01/01/2010').getTime() <=
						0
							? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
									.Leadership === 'None'
								? 'N/A'
								: ''
							: new Date(
									loopmember.requirements.CurrentCadetAchv.LeadLabDateP.substr(
										0,
										10,
									),
							  ).toLocaleDateString('en-US'),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						new Date(loopmember.requirements.CurrentCadetAchv.AEDateP).getTime() -
							new Date('01/01/2010').getTime() <=
						0
							? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
									.Aerospace === 'None'
								? 'N/A'
								: ''
							: new Date(
									loopmember.requirements.CurrentCadetAchv.AEDateP.substr(0, 10),
							  ).toLocaleDateString('en-US'),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAPresentation === false &&
						CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAService === false &&
						CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAWriting === false
							? 'N/A'
							: determineSDA(
									loopmember,
									CadetPromotionRequirementsMap[
										loopmember.requirements.NextCadetAchvID
									],
							  ),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						new Date(loopmember.requirements.HFZRecord.DateTaken).getTime() -
							new Date('01/01/2010').getTime() <=
						0
							? 'N/A'
							: new Date(
									new Date(
										loopmember.requirements.HFZRecord.DateTaken.substr(0, 10),
									).getTime() +
										60 * 60 * 24 * 182 * 1000,
							  ).toLocaleDateString('en-US'),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						new Date(loopmember.requirements.CurrentCadetAchv.DrillDate).getTime() -
							new Date('01/01/2010').getTime() <=
						0
							? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
									.Drill === 'None'
								? 'N/A'
								: CadetPromotionRequirementsMap[
										loopmember.requirements.NextCadetAchvID
								  ].Drill
							: new Date(
									loopmember.requirements.CurrentCadetAchv.DrillDate.substr(
										0,
										10,
									),
							  ).toLocaleDateString('en-US'),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: loopmember.requirements.CurrentCadetAchv.CadetOath ? 'Y' : '',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text:
						new Date(loopmember.requirements.CurrentCadetAchv.MoralLDateP).getTime() -
							new Date('01/01/2010').getTime() <=
						0
							? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
									.CharDev === false
								? 'N/A'
								: ''
							: new Date(
									loopmember.requirements.CurrentCadetAchv.MoralLDateP.substr(
										0,
										10,
									),
							  ).toLocaleDateString('en-US'),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					text: CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
						.Mentor
						? loopmember.requirements.CurrentCadetAchv.OtherReq
							? 'Y'
							: 'N'
						: 'N/A',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
		  ])
		: [];

	const myFill2: TableCell[][] =
		newmem === 'non-zero'
			? [
					[
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
						{ text: 'none', fontSize: mySmallFontSize, bold: false, alignment: 'left' },
					],
			  ]
			: [];

	const nowDate = DateTime.utc();
	const docDefinition: TDocumentDefinitions = {
		pageSize: 'LETTER',
		pageOrientation: 'landscape',
		pageMargins: [30, 30, 64, 30],

		header: {
			text: 'Squadron Achievement Requirements',
			alignment: 'left',
			fontSize: myTitleFontSize,
			margin: [20, 20, 40, 20],
		},

		footer: (currentPage: number, pageCount: number): Content => [
			{
				layout: 'noBorders',
				table: {
					widths: [792 - 36],
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
												text: 'Squadron Report 60-20 Aug 2021',
												bold: true,
												fontSize: mySmallFontSize,
											},
											{
												text: `(Local version, generated by EvMPlus.org on ${
													nowDate.toLocaleString({
														year: 'numeric',
														month: '2-digit',
														day: '2-digit',
													}) ?? ''
												})`,
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
				margin: [20, 20, 40, 20],
			},
		],

		content: [
			// content array start
			{
				// title table start
				table: {
					// table def start
					headerRows: 1,
					widths: [
						30, // Grade
						73, // Full Name
						25, // CAPID
						25, // Flight
						13, // Exp
						36, // Eligible
						30, // Next
						36, // Lead Lab
						36, // AeroEd
						36, // SDA
						36, // HFZ
						36, // Drill Test
						30, // Oath
						36, // Char Dev
						30, // Mentor?
					],
					body: [
						[
							// row 1
							{
								text: 'Grade',
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
								text: 'CAPID',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Flight',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Exp',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Eligible',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Next',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'LeadLab',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'AeroEd',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'SDA',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'HFZ Exp',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'DrillTest',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Oath',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'CharDev',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'Mentor?',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
						], // row 1
						...myFill,
						...myFill2,
					],
				}, // table def end
				layout: {
					fillColor: rowIndex => (rowIndex % 2 === 0 ? '#CCCCCC' : null),
				}, // table layout end
			}, // title table end
		], // content array end
		defaultStyle: {
			font: 'FreeSans',
		},
	}; // doc def end

	return docDefinition;
};
// http://localhost:3001/api/event/2/attendance/log
