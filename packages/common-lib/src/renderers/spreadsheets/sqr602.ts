/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
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

import type * as XLSX from 'xlsx';
import { Maybe } from '../../lib/Maybe';
import { get } from '../../lib/Util';
import { PromotionRequirementsItem } from '../../typings/apis/member/promotionrequirements';
import { pipe } from 'ramda';
import {
	// CadetPromotionRequirements,
	CadetPromotionRequirementsMap,
	CadetPromotionStatus,
	CAPMember,
	CAPProspectiveMemberObject,
	// memoize,
	NHQ,
	// RegistryValues,
} from '../..';
// import { DateTime } from 'luxon';

// function sortNHQName(a: PromotionRequirementsItem, b: PromotionRequirementsItem): number {
// 	const aName = a.member.nameLast + ', ' + a.member.nameFirst;
// 	const bName = b.member.nameLast + ', ' + b.member.nameFirst;
// 	return aName.localeCompare(bName);
// }

// function sortProspectiveName(
// 	a: CAPProspectiveMemberObject,
// 	b: CAPProspectiveMemberObject,
// ): number {
// 	const aName = a.nameLast + ', ' + a.nameFirst;
// 	const bName = b.nameLast + ', ' + b.nameFirst;
// 	return aName.localeCompare(bName);
// }

const getHFZExpire = (reqs: CadetPromotionStatus): string =>
	pipe(
		get<CadetPromotionStatus, 'HFZRecord'>('HFZRecord'),
		Maybe.filter(({ IsPassed }) => IsPassed || reqs.CurrentCadetAchv.CadetAchvID < 4),
		Maybe.map(({ DateTaken, IsPassed }) => [DateTaken.substr(0, 10), IsPassed] as const),
		Maybe.map(([s, f]) => [+new Date(s) + 182 * 24 * 60 * 60 * 1000, f] as const),
		Maybe.map(([s, f]) => new Date(s).toLocaleDateString('en-US') + (!f ? ' F' : '')),
		Maybe.orSome(''),
	)(reqs);

// function determineSDA(
// 	member: PromotionRequirementsItem,
// 	requirements: CadetPromotionRequirements,
// ): string {
// 	let req = 0;
// 	let reqComp = 0;
// 	let compDate = new Date('01/01/2010').toLocaleDateString('en-US');
// 	const recentDate = new Date('01/01/2010');
// 	const reqs = [];
// 	reqs.push({
// 		required: requirements.SDAService,
// 		completionDate: new Date(member.requirements.CurrentCadetAchv.StaffServiceDate),
// 	});
// 	reqs.push({
// 		required: requirements.SDAWriting,
// 		completionDate: new Date(
// 			member.requirements.CurrentCadetAchv.TechnicalWritingAssignmentDate,
// 		),
// 	});
// 	reqs.push({
// 		required: requirements.SDAPresentation,
// 		completionDate: new Date(member.requirements.CurrentCadetAchv.OralPresentationDate),
// 	});

// 	for (let i = 0; i < 3; i++) {
// 		if (reqs[i].required) {
// 			req++;
// 			if (reqs[i].completionDate.getTime() > recentDate.getTime()) {
// 				reqComp++;
// 				if (reqs[i].completionDate.getTime() > new Date(compDate).getTime()) {
// 					compDate = new Date(reqs[i].completionDate).toLocaleDateString('en-US');
// 				}
// 			}
// 		}
// 	}

// 	if (req === 0) {
// 		return 'N/A';
// 	} else if (req > reqComp) {
// 		return '';
// 	} else {
// 		return compDate;
// 	}
// }

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

export const sqr602XL = (): Array<Array<string | number>> => {
	let row: Array<string | number> = ['Event Manager Cadet Status Report SQR 60-2'];
	const retVal: Array<Array<string | number>> = [];
	retVal.push(row);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);

	retVal.push([]);
	row = ['Comments'];
	retVal.push(row);
	retVal.push([]);

	return retVal;
};

export const Formatsqr602XL = (sheet: XLSX.Sheet): XLSX.Sheet => {
	const dateFormat = 'mm/dd/yyyy hh:mm';
	const dateWidth = dateFormat.length;
	sheet['!merges'] = [
		{ s: { c: 0, r: 0 }, e: { c: 4, r: 0 } },
		{ s: { c: 0, r: 1 }, e: { c: 2, r: 1 } },
		{ s: { c: 1, r: 7 }, e: { c: 4, r: 7 } },
	];
	(sheet.D2 as XLSX.CellObject).t = 'd';
	(sheet.D2 as XLSX.CellObject).z = dateFormat;
	// (sheet.D5 as XLSX.CellObject).t = 'd';
	// (sheet.D5 as XLSX.CellObject).z = dateFormat;
	// (sheet.A11 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
	sheet['!cols'] = [
		{ width: 12 },
		{ width: 12 },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ width: 25 },
	];
	sheet['!rows'] = [{ hpx: 19 }, { hpx: 17 }, {}, {}, {}];

	return sheet;
};

export const sqr602MembersXL = (
	nhqmembers: PromotionRequirementsItem[],
	prospectiveMembers: CAPProspectiveMemberObject[],
	// registry: RegistryValues,
): [Array<Array<string | number>>, number[]] => {
	let widths: number[] = [];
	let row: Array<string | number> = [
		'Current Grade',
		'GradeOrder',
		'Full Name',
		'CAPID',
		'Flight',
		'Exp',
		'Eligible or weeks',
		'Next Grade',
		'eSvc Achv',
		'LeadLab',
		'AeroEd',
		'SDA',
		'HFZ Cred Exp',
		'Drill Test',
		'Oath',
		'Char Dev or Wingman',
		'Mentor?',
		'GES',
		'O-Flights',
	];

	const retVal: Array<Array<string | number>> = [];
	widths = [...row.map(item => item.toString().length)];
	retVal.push(row);

	// const orEmptyString = Maybe.orSome('');

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

	const phase1Cadets = nhqmembers;
	nhqmembers[0].member.flight

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
		}));

	for (const loopmember of phase1CadetsDoc) {
		console.log(
			loopmember.requirements !== null
				? getHFZExpire(loopmember.requirements)
				: 'reqs = null',
			loopmember.requirements,
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		row = [
			// Current Grade
			loopmember.member.memberRank,
			// GradeEnum
			loopmember.requirements?.CurrentCadetAchv.CadetAchvID.toString()
				? loopmember.requirements?.CurrentCadetAchv.CadetAchvID.toString()
				: '',
			// Full Name
			`${loopmember.member.memberRank} ${loopmember.member.nameLast}, ${loopmember.member.nameFirst}`,
			// CAPID
			loopmember.member.id.toString(),
			// Flight
			loopmember.member.flight !== null ? loopmember.member.flight : '',
			// Expiration
			loopmember.member.type === 'CAPNHQMember'
				? new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
						new Date().getTime() <=
				  0
					? 'Y'
					: new Date(loopmember.member.expirationDate + 60 * 60 * 24).getTime() -
							new Date().getTime() <=
					  60 * 60 * 24 * 30 * 1000
					? '<'
					: ''
				: '',

			// Eligible or weeks
			loopmember.requirements !== null
				? Maybe.isSome(loopmember.requirements?.LastAprvDate)
					? loopmember.requirements.LastAprvDate.value -
							new Date('01/01/2010').getTime() >
					  0
						? new Date(
								loopmember.requirements.LastAprvDate.value +
									60 * 60 * 24 * 56 * 1000,
						  ).toLocaleDateString('en-US')
						: Math.round(
								Math.round(
									new Date().getTime() -
										(loopmember.member.type === 'CAPNHQMember'
											? new Date(loopmember.member.joined).getTime()
											: 0),
								) /
									(1000 * 60 * 60 * 24 * 7),
						  )
					: Math.round(
							Math.round(
								new Date().getTime() -
									(loopmember.member.type === 'CAPNHQMember'
										? new Date(loopmember.member.joined).getTime()
										: 0),
							) /
								(1000 * 60 * 60 * 24 * 7),
					  )
				: '',
			// Next Grade
			loopmember.requirements !== null
				? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetGradeID].Grade
				: '',
			// eSvcs Achv
			loopmember.requirements !== null
				? loopmember.requirements.CurrentCadetAchv.CadetAchvID.toString() +
				  '-' +
				  loopmember.requirements.MaxAprvStatus.substr(0, 1)
				: '',
			// LeadLab
			loopmember.requirements !== null
				? loopmember.requirements.MaxAprvStatus === 'APR' // if approved status, display a blank or 'N/A' for next
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Leadership === 'None'
						? 'N/A'
						: ''
					: // if incomplete or pending status, display current requirements (even if all filled in)
					new Date(loopmember.requirements.CurrentCadetAchv.LeadLabDateP).getTime() -
							new Date('01/01/2010').getTime() <=
					  0
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Leadership === 'None'
						? 'N/A'
						: ''
					: new Date(
							loopmember.requirements.CurrentCadetAchv.LeadLabDateP.replace(
								/-/g,
								'/',
							).replace(/T.+/, ''),
					  ).toLocaleDateString('en-US')
				: '',
			// AeroEd
			loopmember.requirements !== null
				? loopmember.requirements.MaxAprvStatus === 'APR' // if approved status, display a blank or 'N/A' for next
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Aerospace === 'None'
						? 'N/A'
						: ''
					: // if incomplete or pending status, display current requirements (even if all filled in)
					new Date(loopmember.requirements.CurrentCadetAchv.AEDateP).getTime() -
							new Date('01/01/2010').getTime() <=
					  0
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Aerospace === 'None'
						? 'N/A'
						: ''
					: new Date(
							loopmember.requirements.CurrentCadetAchv.AEDateP.replace(
								/-/g,
								'/',
							).replace(/T.+/, ''),
					  ).toLocaleDateString('en-US')
				: '',
			// SDA
			loopmember.requirements !== null
				? loopmember.requirements.MaxAprvStatus === 'APR' // if approved status, display a blank or 'N/A' for next
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAPresentation === false &&
					  CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAService === false &&
					  CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAWriting === false
						? 'N/A'
						: ''
					: // if incomplete or pending status, display current requirements (even if all filled in)
					CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAPresentation === false &&
					  CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAService === false &&
					  CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.SDAWriting === false
					? 'N/A'
					: 'Undef'
				: '',
			// HFZ credit expiration date
			loopmember.requirements !== null ? getHFZExpire(loopmember.requirements) : '',
			// Drill Test
			loopmember.requirements !== null
				? loopmember.requirements.MaxAprvStatus === 'APR' // if approved status, display drill test or 'N/A' for next
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Drill === 'None'
						? 'N/A'
						: CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
								.Drill
					: // if incomplete or pending status, display current requirements (even if all filled in)
					new Date(loopmember.requirements.CurrentCadetAchv.DrillDate).getTime() -
							new Date('01/01/2010').getTime() <=
					  0
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.Drill === 'None'
						? 'N/A'
						: CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
								.Drill
					: new Date(
							loopmember.requirements.CurrentCadetAchv.DrillDate.replace(
								/-/g,
								'/',
							).replace(/T.+/, ''),
					  ).toLocaleDateString('en-US')
				: '',
			// Oath
			loopmember.requirements !== null
				? loopmember.requirements.CurrentCadetAchv.CadetOath
					? 'Y'
					: ''
				: '',
			// Character Devel
			loopmember.requirements !== null
				? loopmember.requirements.MaxAprvStatus === 'APR' // if approved status, display drill test or 'N/A' for next
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.CharDev === false
						? 'N/A'
						: ''
					: // if incomplete or pending status, display current requirements (even if all filled in)

					new Date(loopmember.requirements.CurrentCadetAchv.MoralLDateP).getTime() -
							new Date('01/01/2010').getTime() <=
					  0
					? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID]
							.CharDev === false
						? 'N/A'
						: ''
					: new Date(
							loopmember.requirements.CurrentCadetAchv.MoralLDateP.replace(
								/-/g,
								'/',
							).replace(/T.+/, ''),
					  ).toLocaleDateString('en-US')
				: '',
			// Mentor?
			loopmember.requirements !== null
				? CadetPromotionRequirementsMap[loopmember.requirements.NextCadetAchvID].Mentor
					? loopmember.requirements.CurrentCadetAchv.OtherReq
						? 'Y'
						: ''
					: 'N/A'
				: '',
			// GES
			loopmember.requirements !== null
				? Maybe.isSome(loopmember.requirements.ges)
					? 'Y'
					: ''
				: '',
			// O-Flights
			loopmember.requirements !== null
				? oflightsShortDescription(loopmember.requirements.oflights)
				: '',
		];
		retVal.push(row);
	}

	return [retVal, widths.map(width => width + 3)];
};

export const Formatsqr602MembersXL = (
	sheet: XLSX.Sheet,
	columnMaxWidths: number[],
	numRows: number,
): XLSX.Sheet => {
	const dateFormat = 'yyyy-mm-dd';
	const dateWidth = dateFormat.length + 1;
	const rowHeight = 22;

	sheet['!rows'] = [{ hpt: rowHeight }];
	let j = 2;
	while (j <= numRows) {
		// rowCount = 0;
		// (sheet[`D${j}`] as XLSX.CellObject).t = 'd';
		// (sheet[`D${j}`] as XLSX.CellObject).z = dateFormat;
		// (sheet[`E${j}`] as XLSX.CellObject).t = 'd';
		// (sheet[`E${j}`] as XLSX.CellObject).z = dateFormat;
		// (sheet[`F${j}`] as XLSX.CellObject).t = 'd';
		// (sheet[`F${j}`] as XLSX.CellObject).z = dateFormat;

		// adjust row height here depending on number of phone or emails
		// emails = ((sheet[`H${j}`] as XLSX.CellObject)?.v as string) ?? '';
		// phones = ((sheet[`I${j}`] as XLSX.CellObject)?.v as string) ?? '';
		// rowCount = Math.max(emails.split('\n').length, phones.split('\n').length);
		// (sheet['!rows'] as XLSX.RowInfo[]).push({ hpt: rowHeight + rowCount * rowHeight });
		j += 1;
	}
	sheet['!cols'] = columnMaxWidths.map(wch => ({ wch }));
	sheet['!cols'] = [
		{ width: 10 },
		{ width: 8 },
		{ width: 32 },
		{ width: 8 },
		{ width: 8 },
		{ width: 6 },
		{ wch: dateWidth },
		{ width: 10 },
		{ width: 8 },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ width: 8 },
		{ wch: dateWidth },
		{ width: 10 },
		{ width: 8 },
		{ width: 12 },
	];

	return sheet;
};
