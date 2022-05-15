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
import { pipe } from 'ramda';
import { Maybe } from '../../lib/Maybe';
import { get } from '../../lib/Util';
import { EventViewerAttendanceRecord, SquadronPOC } from '../../typings/apis/events/events';
import {
	AttendanceStatus,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	EventStatus,
	Member,
	RawResolvedEventObject,
} from '../../typings/types';

const EventStatusDisplay = {
	[EventStatus.DRAFT]: 'Draft',
	[EventStatus.TENTATIVE]: 'Tentative',
	[EventStatus.CONFIRMED]: 'Confirmed',
	[EventStatus.COMPLETE]: 'Complete',
	[EventStatus.CANCELLED]: 'Cancelled',
	[EventStatus.INFORMATIONONLY]: 'Information Only',
};

const DisplayAttendanceStatus = {
	[AttendanceStatus.COMMITTEDATTENDED]: 'Committed/Attended',
	[AttendanceStatus.NOSHOW]: 'No Show',
	[AttendanceStatus.RESCINDEDCOMMITMENTTOATTEND]: 'Rescinded Commitment',
	[AttendanceStatus.NOTPLANNINGTOATTEND]: 'Not Planning to Attend',
};

export function formatPhone(phone: string): string {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	if (phone) {
		const result = phone.match(/\d+/g);
		if (result) {
			phone = result.join('');
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

const GetBestPhones = (inMember: Member): string => {
	let numbersData = '';

	if (inMember.contact.CELLPHONE.PRIMARY) {
		numbersData += 'CP ' + formatPhone(inMember.contact.CELLPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.CELLPHONE.SECONDARY) {
		numbersData += 'CS ' + formatPhone(inMember.contact.CELLPHONE.SECONDARY) + '\n';
	}
	if (inMember.contact.CELLPHONE.EMERGENCY) {
		numbersData += 'CE ' + formatPhone(inMember.contact.CELLPHONE.EMERGENCY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.PRIMARY) {
		numbersData += 'PP ' + formatPhone(inMember.contact.CADETPARENTPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.SECONDARY) {
		numbersData += 'PS ' + formatPhone(inMember.contact.CADETPARENTPHONE.SECONDARY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.EMERGENCY) {
		numbersData += 'PE ' + formatPhone(inMember.contact.CADETPARENTPHONE.EMERGENCY) + '\n';
	}
	if (inMember.contact.HOMEPHONE.PRIMARY) {
		numbersData += 'HP ' + formatPhone(inMember.contact.HOMEPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.HOMEPHONE.EMERGENCY) {
		numbersData += 'HE ' + formatPhone(inMember.contact.HOMEPHONE.EMERGENCY) + '\n';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const GetBestEmails = (inMember: Member): string => {
	let numbersData = '';

	if (inMember.contact.EMAIL.PRIMARY) {
		numbersData += 'EP ' + inMember.contact.EMAIL.PRIMARY + '\n';
	}
	if (inMember.contact.EMAIL.SECONDARY) {
		numbersData += 'ES ' + inMember.contact.EMAIL.SECONDARY + '\n';
	}
	if (inMember.contact.EMAIL.EMERGENCY) {
		numbersData += 'EE ' + inMember.contact.EMAIL.EMERGENCY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.PRIMARY) {
		numbersData += 'PP ' + inMember.contact.CADETPARENTEMAIL.PRIMARY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.SECONDARY) {
		numbersData += 'PS ' + inMember.contact.CADETPARENTEMAIL.SECONDARY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.EMERGENCY) {
		numbersData += 'PE ' + inMember.contact.CADETPARENTEMAIL.EMERGENCY + '\n';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const CustomAttendanceFieldTypeDisplay = {
	[CustomAttendanceFieldEntryType.TEXT]: 'Text',
	[CustomAttendanceFieldEntryType.NUMBER]: 'Number',
	[CustomAttendanceFieldEntryType.DATE]: 'Date',
	[CustomAttendanceFieldEntryType.CHECKBOX]: 'Checkbox',
	[CustomAttendanceFieldEntryType.FILE]: 'File',
};

export const EventXL = (event: RawResolvedEventObject): Array<Array<string | number>> => {
	let row: Array<string | number> = [
		'EvMPlus.org Event Information and Sign-up/Attendance Roster',
	];
	const retVal: Array<Array<string | number>> = [];
	retVal.push(row);
	retVal.push(['This document was generated on: ', '', '', Date.now()]);
	retVal.push([]);
	row = ['Account-Event', '', 'Start Date/Time', 'End Date/Time', 'Location'];
	retVal.push(row);
	row = [
		`${event.accountID}-${event.id}`,
		'',
		event.startDateTime,
		event.endDateTime,
		event.location,
	];
	retVal.push(row);

	retVal.push([]);
	row = ['Status', 'Event Name'];
	retVal.push(row);
	row = [EventStatusDisplay[event.status], event.name];
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

		row = ['Field Name', '', 'Field Type', 'Prefill Value', '', 'See?', 'Edit?'];
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
				customField.title,
				'',
				CustomAttendanceFieldTypeDisplay[customField.type],
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

export const FormatEventXL = (evt: string, sheet: XLSX.Sheet, hostname: string): XLSX.Sheet => {
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
	(sheet.A1 as XLSX.CellObject).s = [
		{ font: { bold: true } },
		{ alignment: { horizontal: 'center' } },
	];
	(sheet.A2 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
	(sheet.D2 as XLSX.CellObject).t = 'd';
	(sheet.D2 as XLSX.CellObject).z = dateFormat;
	(sheet.A5 as XLSX.CellObject).l = { Target: `https://${aid}.${hostname}/eventviewer/${eid}` };

	(sheet.C5 as XLSX.CellObject).t = 'd';
	(sheet.C5 as XLSX.CellObject).z = dateFormat;
	(sheet.D5 as XLSX.CellObject).t = 'd';
	(sheet.D5 as XLSX.CellObject).z = dateFormat;
	(sheet.A11 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
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
	event: RawResolvedEventObject,
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
		'Comments',
		'Unit Name',
		'Commander Name',
		'Unit Contacts',
	];

	const retVal: Array<Array<string | number>> = [];
	for (const fieldName of event.customAttendanceFields) {
		row.push(fieldName.title);
	}
	widths = [...row.map(item => item.toString().length)];
	retVal.push(row);

	const orEmptyString = Maybe.orSome('');

	const getCommanderName = pipe(
		Maybe.flatMap<SquadronPOC, string>(get('commanderName')),
		orEmptyString,
	);

	// attendee.orgInformation
	// |> Maybe.map (\r -> r.commanderName)
	// |> Maybe.withDefault ""

	const getUnitName = pipe(Maybe.flatMap<SquadronPOC, string>(get('orgName')), orEmptyString);

	const getUnitContacts = pipe(
		Maybe.map<SquadronPOC, string>(({ contacts }) =>
			contacts.map<string>(curr => `${curr.type}: ${curr.contact}`).join('\n'),
		),
		orEmptyString,
	);

	// if event attendance present (no count function??)
	for (const attendee of attendance) {
		row = [
			attendee.record.timestamp,
			`${attendee.record.memberID.id} `,
			attendee.record.memberName,
			attendee.record.shiftTime.arrivalTime,
			attendee.record.shiftTime.departureTime,
			DisplayAttendanceStatus[attendee.record.status],
			attendee.record.planToUseCAPTransportation ? 'Y' : 'N',
			orEmptyString(Maybe.map(GetBestEmails)(attendee.member)),
			orEmptyString(Maybe.map(GetBestPhones)(attendee.member)),
			attendee.record.comments,
			getUnitName(attendee.orgInformation),
			getCommanderName(attendee.orgInformation),
			getUnitContacts(attendee.orgInformation),
		];

		for (const fieldVal of attendee.record.customAttendanceFieldValues) {
			row.push(
				typeof fieldVal.value === 'boolean'
					? fieldVal.value
						? 'Y'
						: 'N'
					: Array.isArray(fieldVal.value)
					? `${fieldVal.value.length} files`
					: fieldVal.value,
			);
		}
		widths = widths.map((width, index) =>
			Math.max(
				width,
				(row[index] ?? '')
					.toString()
					.split('\n')
					.map(get('length'))
					.reduce((prev, curr) => Math.max(prev, curr), 0),
			),
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
	const dateFormat = 'yyyy-mm-dd hh:mm';
	const numStaticColumns = 12;
	let rowCount = 0;
	let emails = '';
	let phones = '';
	const rowHeight = 11;

	sheet['!rows'] = [{ hpt: rowHeight }];
	let j = 2;
	while (j <= numRows) {
		rowCount = 0;
		(sheet[`A${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`A${j}`] as XLSX.CellObject).z = dateFormat;
		(sheet[`E${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`E${j}`] as XLSX.CellObject).z = dateFormat;
		(sheet[`F${j}`] as XLSX.CellObject).t = 'd';
		(sheet[`F${j}`] as XLSX.CellObject).z = dateFormat;

		for (let i = 0; i < customAttendanceFieldValues.length; i++) {
			const type = customAttendanceFieldValues[i].type;

			if (type === CustomAttendanceFieldEntryType.DATE) {
				const cell = sheet[
					encodeCell({ c: i + (numStaticColumns + 1), r: j })
				] as XLSX.CellObject;
				cell.t = 'd';
				cell.z = dateFormat;
			}
		}
		// adjust row height here depending on number of phone or emails
		emails = ((sheet[`H${j}`] as XLSX.CellObject)?.v as string) ?? '';
		phones = ((sheet[`I${j}`] as XLSX.CellObject)?.v as string) ?? '';
		rowCount = Math.max(emails.split('\n').length, phones.split('\n').length);
		(sheet['!rows'] as XLSX.RowInfo[]).push({ hpt: rowHeight + rowCount * rowHeight });
		j += 1;
	}
	sheet['!cols'] = columnMaxWidths.map(wch => ({ wch }));

	(sheet.A1 as XLSX.CellObject).t = 't' as XLSX.ExcelDataType;
	(sheet.A1 as XLSX.CellObject).v = 'Timestamp';

	return sheet;
};
