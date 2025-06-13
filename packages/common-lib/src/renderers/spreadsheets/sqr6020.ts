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
	CadetHFZRequirementsMap,
	CadetPromotionStatus,
	CAPNHQMemberObject,
	CAPProspectiveMemberObject,
	CAPMember,
	// get,
	// Maybe,
	memoize,
	// RegistryValues,
} from '../..';
// import { DateTime } from 'luxon';

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

export const sqr6020XL = (): Array<Array<string | number>> => {
	let row: Array<string | number> = [
		'Event Manager Healthy Fitness Zone Status Report SQR 60-20',
	];
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

export const Formatsqr6020XL = (sheet: XLSX.Sheet): XLSX.Sheet => {
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

export const sqr6020MembersXL = (
	nhqmembers: PromotionRequirementsItem[],
	prospectiveMembers: CAPProspectiveMemberObject[],
	// registry: RegistryValues,
): [Array<Array<string | number>>, number[]] => {
	let widths: number[] = [];
	let row: Array<string | number> = [
		'CAPID',
		'GradeOrder',
		'Full Name',
		'HFZ Expire Date',
		'Pacer Req.',
		'Pacer Score',
		'Mile Run Req.',
		'Mile Run Score',
		'Curl Up Req.',
		'Curl Up Score',
		'Push Up Req.',
		'Push Up Score',
		'Sit Reach Req.',
		'Sit Reach Score',
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

	// function sortNHQName(a: PromotionRequirementsItem, b: PromotionRequirementsItem): number {
	// 	const aName = a.member.nameLast + ', ' + a.member.nameFirst;
	// 	const bName = b.member.nameLast + ', ' + b.member.nameFirst;
	// 	return aName.localeCompare(bName);
	// }

	const getHFZExpire = (reqs: CadetPromotionStatus): string =>
		pipe(
			get<CadetPromotionStatus, 'HFZRecord'>('HFZRecord'),
			Maybe.filter(({ IsPassed }) => IsPassed || reqs.CurrentCadetAchv.CadetAchvID < 4),
			Maybe.map(({ DateTaken }) => DateTaken.substr(0, 10)),
			Maybe.map(s => +new Date(s) + 182 * 24 * 60 * 60 * 1000),
			Maybe.map(s => new Date(s).toLocaleDateString('en-US')),
			Maybe.orSome(''),
		)(reqs);

	// const daysInMonth = (month: number, year: number): number => new Date(year, month, 0).getDate();

	// function getNextMonth(): Date {
	// 	const today = new Date();
	// 	const thisMonth = today.getMonth();
	// 	const nextMonth = ((thisMonth + 1) % 12) + 1;
	// 	return new Date(
	// 		nextMonth.toString() +
	// 			'/' +
	// 			daysInMonth(today.getFullYear(), nextMonth).toString() +
	// 			'/' +
	// 			today.getFullYear().toString(),
	// 	);
	// }

	// const phase1Cadets = nhqmembers.filter(
	// 	memberItem => memberItem.requirements.CurrentCadetAchv.CadetAchvID < 4,
	// );
	const phase1Cadets = nhqmembers;
	// const phase234CadetsThatNeedPT = nhqmembers.filter(
	// 	memberItem =>
	// 		memberItem.requirements.CurrentCadetAchv.CadetAchvID >= 4 &&
	// 		new Date(getHFZExpire(memberItem.requirements)).getTime() < getNextMonth().getTime(),
	// );
	// const phase234CadetsThatDontNeedPT = nhqmembers.filter(
	// 	memberItem =>
	// 		memberItem.requirements.CurrentCadetAchv.CadetAchvID >= 4 &&
	// 		new Date(getHFZExpire(memberItem.requirements)).getTime() > getNextMonth().getTime(),
	// );

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
		row = [
			// CAPID
			loopmember.member.id.toString(),
			// GradeEnum
			loopmember.requirements?.CurrentCadetAchv.CadetAchvID.toString()
				? loopmember.requirements?.CurrentCadetAchv.CadetAchvID.toString()
				: '',
			// Full Name
			`${loopmember.member.memberRank} ${loopmember.member.nameLast}, ${loopmember.member.nameFirst}`,
			// HFZ credit expiration date
			loopmember.requirements !== null ? getHFZExpire(loopmember.requirements) : '',
			// Pacer required
			getPromotionRequirementsForMember(loopmember)?.Pacer ?? '',
			// Pacer Score
			'',
			// Mile Run Req
			getPromotionRequirementsForMember(loopmember)?.MileRun ?? '',
			// Mile Run Score
			'',
			// Curl Up Req
			getPromotionRequirementsForMember(loopmember)?.CurlUps ?? '',
			// Curl Up Score
			'',
			// Push Up Req
			getPromotionRequirementsForMember(loopmember)?.PushUps ?? '',
			// Push Up Score
			'',
			// Sit Reach Req
			getPromotionRequirementsForMember(loopmember)?.SitReach ?? '',
			// Sit Reach Score
			'',
		];
		retVal.push(row);
	}

	return [retVal, widths.map(width => width + 3)];
};

export const Formatsqr6020MembersXL = (
	sheet: XLSX.Sheet,
	columnMaxWidths: number[],
	numRows: number,
): XLSX.Sheet => {
	const dateFormat = 'yyyy-mm-dd';
	const dateWidth = dateFormat.length + 1;
	// let rowCount = 0;
	// let emails = '';
	// let phones = '';
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
		{ width: 8 },
		{ width: 15 },
		{ width: 32 },
		{ wch: dateWidth },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
		{ width: 12 },
	];

	// (sheet.A1 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
	// (sheet.A1 as XLSX.CellObject).v = 'Timestamp';

	return sheet;
};
