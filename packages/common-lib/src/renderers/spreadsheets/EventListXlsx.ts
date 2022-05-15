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

import type * as XLSX from 'xlsx';
import {
	//  CustomAttendanceField,
	//  CustomAttendanceFieldEntryType,
	OtherMultCheckboxReturn,
	//  PointOfContactType,
	//  RawPointOfContact,
	RawResolvedEventObject,
	SimpleMultCheckboxReturn,
} from '../../typings/types';
// import { getFullMemberName } from '../../lib/Member';

const presentMultCheckboxReturn = (
	input: SimpleMultCheckboxReturn | OtherMultCheckboxReturn,
	separator = ', ',
): string => {
	const values = input.labels.filter((_, i) => input.values[i]);

	if ('otherSelected' in input && input.otherSelected) {
		values.push(input.otherValue);
	}

	const returnString = values.join(separator);

	return !!returnString ? returnString : '';
};

export const flat = (input: string[]): string => (input.length === 0 ? '' : input.join(', '));

export const EventListXL = (
	events: RawResolvedEventObject[],
): [Array<Array<string | number>>, number[], number[]] => {
	let row: Array<string | number> = ['Event Information List'];
	let widths: number[] = [];
	const retVal: Array<Array<string | number>> = [];
	retVal.push(row);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);
	row = [
		'Event Number',
		'Title           ',
		'Subtitle',
		'Type            ',
		'Meet Time       ',
		'Meet Location',
		'Start Time      ',
		'Event Location',
		'End Time        ',
		'Pickup Time     ',
		'Pickup Location',
		'Transportation Provided',
		'Transportation Description',
		'Comments',
		'Member Comments',
		'Activity Type',
		'Lodging Arrangement',
		'Event website',
		'High adventure description',
		'Uniform',
		'Required participant forms',
		'Accept signups',
		'Meals',
		'Required Items',
		//  'POCs',
		'Desired number of participants',
		'Event status',
		'Entry complete',
		'Show upcoming',
		'Administrative comments',
		'Custom Fields',
	];

	widths = [...row.map(item => item.toString().length)];
	retVal.push(row);
	const evtid = [];

	for (const event of events) {
		row = [
			`${event.accountID}-${event.id}`,
			`${event.name}`,
			`${event.subtitle}`,
			`${event.type}`,
			event.meetDateTime,
			`${event.meetLocation}`,
			event.startDateTime,
			`${event.location}`,
			event.endDateTime,
			event.pickupDateTime,
			`${event.pickupLocation}`,
			`${event.transportationProvided ? 'Y' : 'N'}`,
			`${event.transportationDescription}`,
			`${event.comments}`,
			`${event.memberComments}`,
			`${presentMultCheckboxReturn(event.activity)}`,
			`${presentMultCheckboxReturn(event.lodgingArrangments)}`,
			`${event.eventWebsite}`,
			`${event.highAdventureDescription}`,
			`${presentMultCheckboxReturn(event.uniform)}`,
			`${presentMultCheckboxReturn(event.requiredForms)}`,
			`${event.acceptSignups ? 'Y' : 'N'}`,
			`${presentMultCheckboxReturn(event.mealsDescription)}`,
			`${flat(event.requiredEquipment)}`,
			//  `${flattenPOCs(event.pointsOfContact)}`,
			`${event.desiredNumberOfParticipants}`,
			`${event.status}`,
			`${event.complete ? 'Y' : 'N'}`,
			`${event.showUpcoming ? 'Y' : 'N'}`,
			`${event.administrationComments}`,
		];

		for (const fieldName of event.customAttendanceFields) {
			row.push(fieldName.title);
		}
		evtid.push(event.id);
		retVal.push(row);
	}
	//  return [retVal, widths.map(width => width + 3)];
	return [retVal, widths, evtid];
};

export const FormatEventListXL = (
	sheet: XLSX.Sheet,
	columnMaxWidths: number[],
	eventids: number[],
	numRows: number,
	target: string,
): XLSX.Sheet => {
	const dateFormat = 'yyyy-mm-dd hh:mm';
	const rowHeight = 13;

	sheet['!merges'] = [{ s: { c: 0, r: 0 }, e: { c: 4, r: 0 } }];
	(sheet.D2 as XLSX.CellObject).t = 'd';
	(sheet.D2 as XLSX.CellObject).z = dateFormat;

	const startrow = 5;
	sheet['!rows'] = [{ hpt: rowHeight }];
	let j = startrow;
	while (j <= numRows) {
		(sheet[`A${j}`] as XLSX.CellObject).l = { Target: `${target}${eventids[j - startrow]}` };

		(sheet[`E${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`E${j}`] as XLSX.CellObject).z = dateFormat;
		(sheet[`G${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`G${j}`] as XLSX.CellObject).z = dateFormat;
		(sheet[`I${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`I${j}`] as XLSX.CellObject).z = dateFormat;
		(sheet[`J${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`J${j}`] as XLSX.CellObject).z = dateFormat;
		j += 1;
	}
	sheet['!cols'] = columnMaxWidths.map(wch => ({ wch }));

	// (sheet.A1 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
	// (sheet.A1 as XLSX.CellObject).v = 'Timestamp';

	return sheet;
};
