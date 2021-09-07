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
import {
	CadetPromotionRequirements,
	CadetPromotionRequirementsMap,
	CadetPromotionStatus,
	CAPProspectiveMemberObject,
	get,
	Maybe,
	NHQ,
	RegistryValues,
} from '../..';
import { PromotionRequrementsItem } from '../../typings/apis/member/promotionrequirements';

export const sqr601DocumentDefinition = (
	nhqmembers: PromotionRequrementsItem[],
	newmembers: CAPProspectiveMemberObject[],
	registry: RegistryValues,
): TDocumentDefinitions => {
	const myTest = true;
	const myTitleFontSize = 10;
	const mySmallFontSize = 7;

	function sortNHQName(a: PromotionRequrementsItem, b: PromotionRequrementsItem): number {
		const aName = a.member.nameLast + ', ' + a.member.nameFirst;
		const bName = b.member.nameLast + ', ' + b.member.nameFirst;
		return aName.localeCompare(bName);
	}

	function sortProspectiveName(
		a: CAPProspectiveMemberObject,
		b: CAPProspectiveMemberObject,
	): number {
		const aName = a.nameLast + ', ' + a.nameFirst;
		const bName = b.nameLast + ', ' + b.nameFirst;
		return aName.localeCompare(bName);
	}

	function getHFZExpire(reqs: CadetPromotionStatus): string {
		if (reqs.CurrentCadetAchv.CadetAchvID < 4) {
			if (reqs.HFZRecords.length === 0) {
				return '';
			} else {
				const dateVal = reqs.HFZRecords[0].DateTaken.substr(0, 10);
				return new Date(
					new Date(dateVal).getTime() + 60 * 60 * 24 * 182 * 1000,
				).toLocaleDateString('en-US');
			}
			// return 'Phase I';
		} else {
			const passedRecord = reqs.HFZRecords.find(rec => rec.IsPassed);
			if (!!passedRecord) {
				const dateVal = passedRecord.DateTaken.substr(0, 10);
				return new Date(
					new Date(dateVal).getTime() + 60 * 60 * 24 * 182 * 1000,
				).toLocaleDateString('en-US');
			} else {
				return '';
			}
		}
	}

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

	const unpoweredFlights = [1, 2, 3, 4, 5];
	const poweredFlights = [6, 7, 8, 9, 10];

	const oflightsShortDescription = (rides: NHQ.OFlight[]): string =>
		(
			[...new Set(rides.map(get('Syllabus')))]
				.reduce<[number, number]>(
					([powered, unpowered], syllabus) =>
						poweredFlights.includes(syllabus)
							? [powered + 1, unpowered]
							: unpoweredFlights.includes(syllabus)
							? [powered, unpowered + 1]
							: [powered, unpowered],
					[0, 0],
				)
				.join('p | ') + 'u'
		)
			.replace('0p', '_p')
			.replace('0u', '_u');

	const fullMembers = myTest
		? nhqmembers.sort(sortNHQName).map((loopmember): TableCell[] => [
				{
					// Grade
					text: loopmember.member.memberRank,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Full Name
					text: loopmember.member.nameLast + ', ' + loopmember.member.nameFirst,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// CAPID
					text: loopmember.member.id,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Flight
					text: loopmember.member.flight,
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Expired? - '<' means within 30 days of expiring
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
					// Eligible date for next promotion
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
					// Next Grade
					text:
						CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Grade,
					fontSize: mySmallFontSize,
					bold: false,
					alighment: 'left',
				},
				{
					// Lead Lab pass date or N/A if not required
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
					// Aerospace Education pass date or N/A if not required
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
					// SDA requirements
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
					// HFZ credit expiration date
					text: getHFZExpire(loopmember.requirements),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Drill Test required or date passed
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
					// Oath
					text: loopmember.requirements.CurrentCadetAchv.CadetOath ? 'Y' : '',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Character Development
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
					// Mentor?
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
				{
					// GES complete?
					text: Maybe.isSome(loopmember.requirements.ges) ? 'Y' : '',
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
				{
					// Orientation Flights
					text: oflightsShortDescription(loopmember.requirements.oflights),
					fontSize: mySmallFontSize,
					bold: false,
					alignment: 'left',
				},
		  ])
		: [];

	const prospectiveMembers = myTest
		? newmembers
				.sort(sortProspectiveName)
				.filter(mem => mem.seniorMember === false)
				.map((loopmember): TableCell[] => [
					{
						text: loopmember.nameLast + ', ' + loopmember.nameFirst,
						fontSize: mySmallFontSize,
						bold: false,
						alignment: 'left',
					},
					{
						text: loopmember.hasNHQReference ? 'Y' : 'N',
						fontSize: mySmallFontSize,
						bold: false,
						alignment: 'left',
					},
				])
		: [];

	const nowDate = DateTime.utc();
	const docDefinition: TDocumentDefinitions = {
		pageSize: 'LETTER',
		pageOrientation: 'landscape',
		pageMargins: [25, 40, 64, 40],

		header: {
			text: registry.Website.Name + ' Cadet Status Report',
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
												text: 'Squadron Report 60-1 Aug 2021',
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
				// table start
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
						30, // GES
						35, // O-Flights
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
							{
								text: 'GES',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'O-Flights',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
						], // row 1
						...fullMembers,
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
						73, // Full Name
						70, // nhq
					],
					body: [
						[
							// row 1
							{
								text: 'Full Name',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
							{
								text: 'NHQ Association?',
								fontSize: mySmallFontSize,
								bold: true,
								alignment: 'left',
							},
						], // row 1
						...prospectiveMembers,
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
