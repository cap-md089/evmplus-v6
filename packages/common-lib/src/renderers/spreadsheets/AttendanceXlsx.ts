/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import type * as XLSX from 'xlsx';
import { Maybe } from '../../lib/Maybe';
import { get } from '../../lib/Util';
import { EventViewerAttendanceRecord } from '../../typings/apis/events/events';
import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	Member,
	RawEventObject
} from '../../typings/types';

const EventStatus = [
	'Draft',
	'Tentative',
	'Confirmed',
	'Complete',
	'Cancelled',
	'Information Only',
];

const AttendanceStatus = [
	'Committed/Attended',
	'No Show',
	'Rescinded Commitment',
	'Not Planning to Attend',
];

export function formatPhone(phone: string) {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	if (phone) {
		if (phone!.match(/\d+/g)) {
			phone = phone!.match(/\d+/g)!.join('').toString();
			// add formatting
			return (
				'(' +
				phone.substring(0, 3) +
				')' +
				phone.substring(3, 6) +
				'-' +
				phone.substring(6, 10)
			);
		} else {
			return '';
		}
	} else {
		return '';
	}
}

const GetBestPhones = (inMember: Member) => {
	let numbersData = '';

	if (inMember.contact.CELLPHONE.PRIMARY) {
		numbersData += 'CP ' + formatPhone(inMember.contact.CELLPHONE.PRIMARY) + '\n\r';
	}
	if (inMember.contact.CELLPHONE.SECONDARY) {
		numbersData += 'CS ' + formatPhone(inMember.contact.CELLPHONE.SECONDARY) + '\n\r';
	}
	if (inMember.contact.CELLPHONE.EMERGENCY) {
		numbersData += 'CE ' + formatPhone(inMember.contact.CELLPHONE.EMERGENCY) + '\n\r';
	}
	if (inMember.contact.CADETPARENTPHONE.PRIMARY) {
		numbersData += 'PP ' + formatPhone(inMember.contact.CADETPARENTPHONE.PRIMARY) + '\n\r';
	}
	if (inMember.contact.CADETPARENTPHONE.SECONDARY) {
		numbersData += 'PS ' + formatPhone(inMember.contact.CADETPARENTPHONE.SECONDARY) + '\n\r';
	}
	if (inMember.contact.CADETPARENTPHONE.EMERGENCY) {
		numbersData += 'PE ' + formatPhone(inMember.contact.CADETPARENTPHONE.EMERGENCY) + '\n\r';
	}
	if (inMember.contact.HOMEPHONE.PRIMARY) {
		numbersData += 'HP ' + formatPhone(inMember.contact.HOMEPHONE.PRIMARY) + '\n\r';
	}
	if (inMember.contact.HOMEPHONE.EMERGENCY) {
		numbersData += 'HE ' + formatPhone(inMember.contact.HOMEPHONE.EMERGENCY) + '\n\r';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const GetBestEmails = (inMember: Member) => {
	let numbersData = '';

	if (inMember.contact.EMAIL.PRIMARY) {
		numbersData += 'EP ' + inMember.contact.EMAIL.PRIMARY + '\n\r';
	}
	if (inMember.contact.EMAIL.SECONDARY) {
		numbersData += 'ES ' + inMember.contact.EMAIL.SECONDARY + '\n\r';
	}
	if (inMember.contact.EMAIL.EMERGENCY) {
		numbersData += 'EE ' + inMember.contact.EMAIL.EMERGENCY + '\n\r';
	}
	if (inMember.contact.CADETPARENTEMAIL.PRIMARY) {
		numbersData += 'PP ' + inMember.contact.CADETPARENTEMAIL.PRIMARY + '\n\r';
	}
	if (inMember.contact.CADETPARENTEMAIL.SECONDARY) {
		numbersData += 'PS ' + inMember.contact.CADETPARENTEMAIL.SECONDARY + '\n\r';
	}
	if (inMember.contact.CADETPARENTEMAIL.EMERGENCY) {
		numbersData += 'PE ' + inMember.contact.CADETPARENTEMAIL.EMERGENCY + '\n\r';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const CustomAttendanceFieldType = ['Text', 'Number', 'Date', 'Checkbox', 'File'];

export const EventXL = (event: RawEventObject): Array<Array<string | number>> => {
	let row: Array<string | number> = [
		'CAPUnit.com Event Information and Sign-up/Attendance Roster',
	];
	const retVal: Array<Array<string | number>> = [];
	retVal.push(row);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);
	row = ['Account-Event', '', 'Start Date/Time', 'End Date/Time', 'Location'];
	retVal.push(row);
	row = [
		event.accountID + '-' + event.id,
		'',
		event.startDateTime,
		event.endDateTime,
		event.location,
	];
	retVal.push(row);

	retVal.push([]);
	row = ['Status', 'Event Name'];
	retVal.push(row);
	row = [EventStatus[event.status], event.name];
	retVal.push(row);

	retVal.push([]);
	row = ['Comments'];
	retVal.push(row);
	row = [event.comments];
	retVal.push(row);

	if (event.customAttendanceFields.length > 0) {
		const numPadding = 8;
		for (let l = 0; l < numPadding; l++) {
			retVal.push([]);
		}
		retVal.push(['Custom Attendance Fields', '', '', '', '', 'Can Member']);

		row = ['', 'Field Name', 'Field Type', 'Prefill Value', '', 'See?', 'Edit?'];
		retVal.push(row);
		retVal.push([]);
		let fieldPreFill: string;

		for (const customField of event.customAttendanceFields) {
			if (customField.type !== CustomAttendanceFieldEntryType.FILE) {
				fieldPreFill =
					typeof customField.preFill === 'boolean'
						? customField.preFill
							? 'Y'
							: 'N'
						: typeof customField.preFill === 'number'
						? customField.preFill.toString()
						: customField.preFill;
			} else {
				fieldPreFill = 'N/A';
			}
			row = [
				'',
				customField.title,
				CustomAttendanceFieldType[customField.type],
				fieldPreFill,
				'',
				customField.displayToMember ? 'Y' : 'N',
				customField.allowMemberToModify ? 'Y' : 'N',
			];
			retVal.push(row);
		}
	}

	return retVal;
};

export const FormatEventXL = (evt: string, sheet: XLSX.Sheet): XLSX.Sheet => {
	const dateFormat = 'mm/dd/yyyy hh:mm';
	const dateWidth = dateFormat.length;
	const aid = evt.split('-')[0];
	const eid = evt.split('-')[1];
	sheet['!merges'] = [
		{ s: { c: 0, r: 0 }, e: { c: 4, r: 0 } },
		{ s: { c: 0, r: 1 }, e: { c: 2, r: 1 } },
		{ s: { c: 1, r: 7 }, e: { c: 4, r: 7 } },
		{ s: { c: 0, r: 10 }, e: { c: 4, r: 15 } },
	];
	sheet.A1.s = [{ font: { bold: true } }, { alignment: { horizontal: 'center' } }];
	sheet.A2.t = 't';
	sheet.D2.t = 'd';
	sheet.D2.z = dateFormat;
	sheet.A5.l = { Target: 'https://' + aid + '.capunit.com/eventviewer/' + eid };

	sheet.C5.t = 'd';
	sheet.C5.z = dateFormat;
	sheet.D5.t = 'd';
	sheet.D5.z = dateFormat;
	sheet.A11.t = 't';
	sheet['!cols'] = [
		{ width: 12 },
		{ width: 12 },
		{ wch: dateWidth },
		{ wch: dateWidth },
		{ width: 25 },
	];
	sheet['!rows'] = [{ hpx: 19 }, {}, {}, { hpx: 17 }, { hpx: 14 }, {}, { hpx: 17 }, { hpx: 14 }];

	return sheet;
};

export const AttendanceXL = (
	event: RawEventObject,
	attendance: EventViewerAttendanceRecord[],
): [Array<Array<string | number>>, number[]] => {
	let widths: number[] = [];
	let row: Array<string | number> = [
		'Timestamp',
		'CAPID',
		'Grade/Name',
		'Arrival Time',
		'Departure Time',
		'Status',
		'CAP Transport',
		'Email(s)',
		'Phone(s)',
	];

	const retVal: Array<Array<string | number>> = [];
	for (const fieldName of event.customAttendanceFields) {
		row.push(fieldName.title);
	}
	widths = [...row.map(item => item.toString().length)];
	retVal.push(row);

	const orEmptyString = Maybe.orSome('');

	// if event attendance present (no count function??)
	for (const attendee of attendance) {
		row = [
			attendee.record.timestamp,
			attendee.record.memberID.id + ' ',
			attendee.record.memberName,
			attendee.record.shiftTime.arrivalTime,
			attendee.record.shiftTime.departureTime,
			AttendanceStatus[attendee.record.status],
			attendee.record.planToUseCAPTransportation ? 'Y' : 'N',
			orEmptyString(Maybe.map(GetBestEmails)(attendee.member)),
			orEmptyString(Maybe.map(GetBestPhones)(attendee.member)),
		];
		for (const fieldVal of attendee.record.customAttendanceFieldValues) {
			row.push(
				typeof fieldVal.value === 'boolean'
					? fieldVal.value
						? 'Y'
						: 'N'
					: Array.isArray(fieldVal.value)
					? `${fieldVal.value} files`
					: fieldVal.value,
			);
		}
		widths = widths.map((width, index) =>
			Math.max(width, (row[index] ?? '').toString().split('\n').map(get('length')).reduce((prev, curr) => Math.max(prev, curr), 0)),
		);
		retVal.push(row);
	}
	return [retVal, widths.map(width => width + 3)];
};

export const FormatAttendanceXL = (
	sheet: XLSX.Sheet,
	columnMaxWidths: number[],
	customAttendanceFieldValues: CustomAttendanceField[],
	encodeCell: (val: { c: number; r: number }) => string,
	numRows: number,
): XLSX.Sheet => {
	const dateFormat = 'mm/dd/yyyy hh:mm';
	const numStaticColumns = 9;
	let rowCount = 0;
	let emails = '';
	let phones = '';
	const rowHeight = 11;

	sheet['!rows'] = [{ hpt: rowHeight }];
	let j = 2;
	while (j <= numRows) {
		rowCount = 0;
		sheet['A' + j].t = 'd';
		sheet['A' + j].z = dateFormat;
		sheet['D' + j].t = 'd';
		sheet['D' + j].z = dateFormat;
		sheet['E' + j].t = 'd';
		sheet['E' + j].z = dateFormat;

		for (let i = 0; i < customAttendanceFieldValues.length; i++) {
			const type = customAttendanceFieldValues[i].type;

			if (type === CustomAttendanceFieldEntryType.DATE) {
				sheet[encodeCell({ c: i + (numStaticColumns + 1), r: j })].t = 'd';
				sheet[encodeCell({ c: i + (numStaticColumns + 1), r: j })].z = dateFormat;
			}
		}
		// adjust row height here depending on number of phone or emails
		emails = sheet['H' + j]?.v ?? '';
		phones = sheet['I' + j]?.v ?? '';
		rowCount = Math.max(emails.split('\n').length, phones.split('\n').length);
		sheet['!rows'].push({ hpt: rowHeight + rowCount * rowHeight });
		j += 1;
	}
	sheet['!cols'] = columnMaxWidths.map(wch => ({ wch }));

	sheet.A1.t = 't';
	sheet.A1.v = 'Timestamp';

	return sheet;
};
