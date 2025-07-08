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

import type * as XLSX from 'xlsx-js-style';
import { Maybe } from '../../lib/Maybe';
import { get } from '../../lib/Util';
import { PromotionRequirementsItem } from '../../typings/apis/member/promotionrequirements';
import { pipe } from 'ramda';
import {
	CadetPromotionStatus,
	CAPMember,
	CAPNHQMemberObject,
} from '../..';

const getHFZExpire = (reqs: CadetPromotionStatus): string =>
	pipe(
		get<CadetPromotionStatus, 'HFZRecord'>('HFZRecord'),
		Maybe.filter(({ IsPassed }) => IsPassed || reqs.CurrentCadetAchv.CadetAchvID < 4),
		Maybe.map(({ DateTaken, IsPassed }) => [DateTaken.substr(0, 10), IsPassed] as const),
		Maybe.map(([s, f]) => [+new Date(s) + 182 * 24 * 60 * 60 * 1000, f] as const),
		Maybe.map(([s, f]) => new Date(s).toLocaleDateString('en-US') + (!f ? ' F' : '')),
		Maybe.orSome(''),
	)(reqs);

// const unpoweredFlights = [1, 2, 3, 4, 5];
const poweredFlights = [6, 7, 8, 9, 10];

// const oflightsShortDescription = (rides: NHQ.OFlight[]): string =>
// 	(
// 		[...new Set(rides.map(get('Syllabus')))]
// 			.reduce<[number, number]>(
// 				([powered, unpowered], syllabus) =>
// 					poweredFlights.includes(syllabus)
// 						? [powered + 1, unpowered]
// 						: unpoweredFlights.includes(syllabus)
// 						? [powered, unpowered + 1]
// 						: [powered, unpowered],
// 				[0, 0],
// 			)
// 			.join('p | ') + 'u'
// 	)
// 		.replace('0p', '_p')
// 		.replace('0u', '_u');

export const sqr521Title = 'Event Manager Cadet Status Report SQR 52-1';

export const sqr521XL = (): Array<Array<object | string | number>> => {
	let row: Array<object | string | number> = [sqr521Title];
	const retVal: Array<Array<object |string | number>> = [];
	retVal.push(row);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);

	retVal.push([]);
	row = ['Comments'];
	retVal.push(row);
	retVal.push([]);

	return retVal;
};

export const Formatsqr521XL = (sheet: XLSX.Sheet): XLSX.Sheet => {
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

function formatPhoneNumber(phone: string): string {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
};

export const sqr521MembersXL = (
	nhqmembers: PromotionRequirementsItem[],
	// prospectiveMembers: CAPProspectiveMemberObject[],
	// registry: RegistryValues,
): [Array<Array<object | string | number>>, number[]] => {
	let widths: number[] = [];
	let row: Array<object | string | number> = [
		'Sort',
		'Current Grade',
		'GradeOrder',
		'Full Name',
		'CAPID',
		'Bday',
		'Flight',
		'Joined',
		'Oride 1',
		'Oride 2',
		'Oride 3',
		'Oride 4',
		'Oride 5',
		'Cellphone',
		'Email',
		'Parent Phone',
		'Parent Email',
	];

	const retVal: Array<Array<object | string | number>> = [];
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
		// ...prospectiveMembers.filter(mem => mem.memberRank === 'CADET'),
	]
		.sort(sortByMemberName)
		.map((mem): {
			requirements: PromotionRequirementsItem['requirements'] | null;
			member: CAPNHQMemberObject;
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
		let flightCount = 0;
        const poweredFlightDates: string[] = [ '', '', '', '', '' ];
        if (loopmember.requirements?.oflights) {
            loopmember.requirements.oflights.forEach(ride => {
                const idx = poweredFlights.indexOf(ride.Syllabus);
                if (idx !== -1) {
                    poweredFlightDates[idx] = ride.FltDate
                        ? new Date(ride.FltDate).toLocaleDateString('en-US')
                        : '';
					flightCount += 1;
                }
            });
        }
		// const joinedDate = new Date(loopmember.member.joined);
		const birthDate: number = new Date(loopmember.member.dateOfBirth).getTime();
		const olderThan = new Date().setDate(new Date().getDate() - (365.25 * 18));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		row = [
			birthDate < olderThan ? "A" : flightCount === 5 ? "C" : loopmember.member.flight === "XRay" ? "X" : "",
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
			// Bday
			// new Date(olderThan).toLocaleDateString('en-US'),
			{ v: loopmember.member.dateOfBirth
				? new Date(birthDate).toLocaleDateString('en-US')
				: '' },
			// Flight
			loopmember.member.flight !== null 
				? loopmember.member.flight 
				: '' ,
			// Joined
			{ v: loopmember.member.joined
				? new Date(loopmember.member.joined).toLocaleDateString('en-US')
				: '' , t: "s", s: {} },
			// O-Flights
			poweredFlightDates[0] ?? '',
			poweredFlightDates[1] ?? '',
			poweredFlightDates[2] ?? '',
			poweredFlightDates[3] ?? '',
			poweredFlightDates[4] ?? '',
			loopmember.member.contact.CELLPHONE.PRIMARY 
			    ? formatPhoneNumber(loopmember.member.contact.CELLPHONE.PRIMARY)
			    : '',
			loopmember.member.contact.EMAIL.PRIMARY ?? '',
			loopmember.member.contact.CADETPARENTPHONE.PRIMARY
			    ? formatPhoneNumber(loopmember.member.contact.CADETPARENTPHONE.PRIMARY)
			    : '',
			loopmember.member.contact.CADETPARENTEMAIL.PRIMARY ?? '',
		];
		retVal.push(row);
	}

	return [retVal, widths.map(width => width + 3)];
};

export const Formatsqr521MembersXL = (
	sheet: XLSX.Sheet,
	columnMaxWidths: number[],
	numRows: number,
): XLSX.Sheet => {
	const dateFormat = 'yyyy-mm-dd';
	const dateWidth = dateFormat.length + 1;
	const rowHeight = 22;

	sheet['!rows'] = [{ hpt: rowHeight }];
	let j = 2;
	// while (j <= numRows) {
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
		// (sheet[`G${j}`] as XLSX.CellObject).t = 's';
		// (sheet[`G${j}`] as XLSX.CellObject).t = 's';
		// (sheet[`G${j}`] as XLSX.CellObject).s = '{ font: { bold: true, color: { rgb: "FF0000" } } }';
	// 	j += 1;
	// }
	sheet['!cols'] = columnMaxWidths.map(wch => ({ wch }));
	sheet['!cols'] = [
		{ width: 8 }, // Age Group
		{ width: 10 }, // Current Grade
		{ width: 8 }, // Grade Order
		{ width: 32 }, // Full Name
		{ width: 8 },  // CAPID
		{ wch: dateWidth }, // Bday
		{ width: 8 }, // Flight
		{ wch: dateWidth }, // Joined
		{ wch: dateWidth }, // Oride 1
		{ wch: dateWidth },	 // Oride 2
		{ wch: dateWidth }, // Oride 3
		{ wch: dateWidth }, // Oride 4
		{ wch: dateWidth }, // Oride 5
		{ width: 18 }, // Cellphone
		{ width: 40 }, // Email
		{ width: 18 }, // Parent Phone
		{ width: 40 }, // Parent Email
	];

	return sheet;
};
