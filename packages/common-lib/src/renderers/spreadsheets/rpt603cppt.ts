/**
 * Copyright (C) 2026 GlennRioux
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
import { api } from '../..';

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (value: string): Date | null => {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);

	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const rpt603CPPTXL = (): Array<Array<string | number>> => {
	const retVal: Array<Array<string | number>> = [];

	retVal.push(['Event Manager RPT 60-3 CPPT Status Report']);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);

	return retVal;
};

export const Formatrpt603CPPTXL = (sheet: XLSX.Sheet): XLSX.Sheet => {
	const dateFormat = 'mm/dd/yyyy hh:mm';
	const dateWidth = dateFormat.length;

	sheet['!merges'] = [
		{ s: { c: 0, r: 0 }, e: { c: 5, r: 0 } },
		{ s: { c: 0, r: 1 }, e: { c: 2, r: 1 } },
	];
	(sheet.D2 as XLSX.CellObject).t = 'd';
	(sheet.D2 as XLSX.CellObject).z = dateFormat;
	sheet['!cols'] = [
		{ width: 16 },
		{ width: 28 },
		{ width: 12 },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ wch: dateWidth },
	];

	return sheet;
};

export const rpt603CPPTMembersXL = (
	memberStatuses: api.member.cpptstatus.CPPTStatusItem[],
): [Array<Array<string | number>>, number[]] => {
	const generatedAt = new Date();
	const todayMidnight = new Date(
		generatedAt.getFullYear(),
		generatedAt.getMonth(),
		generatedAt.getDate(),
	).getTime();
	const expiringSoonThreshold = todayMidnight + 30 * DAY_MS;

	const retVal: Array<Array<string | number>> = [];
	const row = [
		'Member Type',
		'Full Name',
		'CAPID',
		'CPPT Completion Date',
		'CPPT Expiration Date',
	];

	const widths = [...row.map(item => item.length)];

	retVal.push(row);

	for (const item of [...memberStatuses].sort((a, b) =>
		`${a.nameLast}, ${a.nameFirst}`.localeCompare(`${b.nameLast}, ${b.nameFirst}`),
	)) {
		const completionDate = parseDate(item.cpptCompletionDate);
		const expirationDate = completionDate ? new Date(completionDate.getTime()) : null;

		if (expirationDate) {
			expirationDate.setFullYear(expirationDate.getFullYear() + 1);
		}

		const expirationTime = expirationDate
			? new Date(
					expirationDate.getFullYear(),
					expirationDate.getMonth(),
					expirationDate.getDate(),
			  ).getTime()
			: Number.NEGATIVE_INFINITY;

		const isExpired = expirationTime < todayMidnight;
		const isExpiringSoon = !isExpired && expirationTime <= expiringSoonThreshold;

		const nameCell: { v: string; s?: XLSX.CellStyle } = {
			v: `${item.memberRank} ${item.nameLast}, ${item.nameFirst}`,
		};

		if (isExpired) {
			nameCell.s = {
				fill: { fgColor: { rgb: 'FFC7CE' } },
				font: { color: { rgb: '9C0006' }, bold: true },
			};
		} else if (isExpiringSoon) {
			nameCell.s = {
				fill: { fgColor: { rgb: 'FFEB9C' } },
				font: { color: { rgb: '9C6500' }, bold: true },
			};
		}

		const currentRow = [
			item.memberType,
			nameCell,
			item.capid,
			item.cpptCompletionDate,
			expirationDate ? expirationDate.toISOString().substring(0, 10) : '',
		];

		for (let i = 0; i < currentRow.length; i++) {
			if (typeof currentRow[i] === 'object' && currentRow[i] !== null && typeof currentRow[i] === 'object' && 'v' in (currentRow[i] as object)) {
				widths[i] = Math.max(widths[i], (currentRow[i] as any).v.toString().length);
			} else {
				widths[i] = Math.max(widths[i], currentRow[i].toString().length);
			}
		}

		retVal.push(currentRow as Array<string | number>);
	}

	return [retVal, widths];
};

export const Formatrpt603CPPTMembersXL = (
	sheet: XLSX.Sheet,
	widths: number[],
	rowCount: number,
): XLSX.Sheet => {
	sheet['!cols'] = widths.map(width => ({ width: width + 2 }));

	for (let i = 2; i <= rowCount; i++) {
		const cpptCell = sheet[`D${i}`] as XLSX.CellObject | undefined;
		const expirationCell = sheet[`E${i}`] as XLSX.CellObject | undefined;

		if (cpptCell && cpptCell.v) {
			cpptCell.t = 'd';
			cpptCell.z = 'mm/dd/yyyy';
		}

		if (expirationCell && expirationCell.v) {
			expirationCell.t = 'd';
			expirationCell.z = 'mm/dd/yyyy';
		}
	}

	return sheet;
};