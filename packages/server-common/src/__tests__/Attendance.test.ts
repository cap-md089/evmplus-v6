/**
 * Copyright (C) 2020 Andrew Rioux
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

import {
	AttendanceStatus,
	collectGeneratorAsync,
	CustomAttendanceFieldEntryType,
	EventStatus,
	EventType,
	Maybe,
	PointOfContactType,
	RawEventObject,
} from 'common-lib';
import { getDbRef, TestConnection } from 'server-jest-config';
import { getAttendanceForEvent, RawAttendanceDBRecord } from '../Attendance';

describe('Attendance', () => {
	const dbref = getDbRef();

	beforeAll(TestConnection.setup(dbref));
	afterAll(TestConnection.teardown(dbref));

	it('should get all attendance for event', async done => {
		const schema = dbref.connection.getSchema();

		// const testEvent = getTestEvent();

		// const testRec1 = getTestAttendanceRecord(testEvent);
		// const testRec2 = getTestAttendanceRecord(testEvent);
		// const testRec3 = {
		//     ...getTestAttendanceRecord(testEvent),
		//     memberID: { id: 911111, type: 'CAPNHQMember' }
		// };

		const rec1: RawAttendanceDBRecord = {
			accountID: 'vw101',
			comments: "don't need ride",
			customAttendanceFieldValues: [
				{
					type: CustomAttendanceFieldEntryType.CHECKBOX,
					title: 'Custom Checkbox',
					value: false,
				},
			],
			eventID: 1,
			memberID: { id: 911111, type: 'CAPNHQMember' },
			memberName: 'C/1stLt Eggbert Engle',
			planToUseCAPTransportation: false,
			shiftTime: { arrivalTime: 1618008300000, departureTime: 1618167600000 },
			status: AttendanceStatus.COMMITTEDATTENDED,
			summaryEmailSent: false,
			timestamp: 1615822520769,
		};

		const rec2: RawAttendanceDBRecord = {
			accountID: 'vw101',
			comments: "don't need ride",
			customAttendanceFieldValues: [
				{
					type: CustomAttendanceFieldEntryType.CHECKBOX,
					title: 'Custom Checkbox',
					value: true,
				},
			],
			eventID: 1,
			memberID: { id: 911112, type: 'CAPNHQMember' },
			memberName: 'C/1stLt Frank Farmer',
			planToUseCAPTransportation: false,
			shiftTime: { arrivalTime: 1618008300000, departureTime: 1618167600000 },
			status: AttendanceStatus.COMMITTEDATTENDED,
			summaryEmailSent: false,
			timestamp: 1615822520769,
		};

		const rec3: RawAttendanceDBRecord = {
			accountID: 'vw101',
			comments: "don't need ride",
			customAttendanceFieldValues: [
				{
					type: CustomAttendanceFieldEntryType.CHECKBOX,
					title: 'Custom Checkbox',
					value: false,
				},
			],
			eventID: 1,
			memberID: { id: 911114, type: 'CAPNHQMember' },
			memberName: '1stLt Howard Hughes',
			planToUseCAPTransportation: false,
			shiftTime: { arrivalTime: 1618008300000, departureTime: 1618167600000 },
			status: AttendanceStatus.COMMITTEDATTENDED,
			summaryEmailSent: false,
			timestamp: 1615822520769,
		};

		const attendanceCollection = schema.getCollection<RawAttendanceDBRecord>('Attendance');
		await attendanceCollection.add(rec1).add(rec2).add(rec3).execute();

		const event: RawEventObject = {
			id: 1,
			name: 'Monthly Staff Drill Meeting',
			type: EventType.REGULAR,
			author: { id: 546319, type: 'CAPNHQMember' },
			status: EventStatus.CONFIRMED,
			teamID: 1,
			debrief: [],
			fileIDs: [],
			uniform: {
				labels: [
					'Dress Blue A',
					'Dress Blue B',
					'Battle Dress Uniform or Airman Battle Uniform (BDU/ABU)',
					'PT Gear',
					'Polo Shirts (Senior Members)',
					'Blue Utilities (Senior Members)',
					'Civilian Attire',
					'Flight Suit',
					'Not Applicable',
				],
				values: [false, false, true, false, true, true, false, false, false],
			},
			activity: {
				labels: [
					'Squadron Meeting',
					'Classroom/Tour/Light',
					'Backcountry',
					'Flying',
					'Physically Rigorous',
					'Recurring Meeting',
				],
				values: [false, true, false, false, false, true],
				otherSelected: false,
			},
			comments: 'Join MS Teams meeting using [this link](https://mdwg.live/wingdrill)',
			complete: true,
			location: 'Virtual',
			subtitle: 'Virtual',
			accountID: 'vw101',
			emailBody: Maybe.none(),
			endDateTime: 1639843200000,
			timeCreated: 1613833876048,
			eventWebsite: '',
			meetDateTime: 1639836000000,
			meetLocation: 'Virtual',
			registration: null,
			showUpcoming: true,
			timeModified: 1613833876048,
			acceptSignups: true,
			requiredForms: {
				labels: [
					'CAP Identification Card',
					'CAPF 31 Application For CAP Encampment Or Special Activity',
					'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
					'CAPF 101 Specialty Qualification Card',
					'CAPF 160 CAP Member Health History Form',
					'CAPF 161 Emergency Information',
					'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication',
				],
				values: [true, false, false, false, false, false, false],
				otherSelected: false,
			},
			startDateTime: 1639836000000,
			memberComments: '',
			pickupDateTime: 1639843200000,
			pickupLocation: 'Virtual',
			signUpPartTime: false,
			pointsOfContact: [
				{
					type: PointOfContactType.INTERNAL,
					position: '',
					email: 'me@you.com',
					phone: '1234567980',
					receiveRoster: false,
					receiveUpdates: false,
					memberReference: { id: 111124, type: 'CAPNHQMember' },
					receiveEventUpdates: false,
					receiveSignUpUpdates: false,
				},
			],
			groupEventNumber: {
				labels: ['Not Required', 'To Be Applied For', 'Applied For'],
				otherValue: '',
				otherValueSelected: true,
			},
			mealsDescription: {
				labels: ['No meals provided', 'Meals provided', 'Bring own food', 'Bring money'],
				values: [false, false, true, false],
				otherSelected: false,
			},
			participationFee: null,
			googleCalendarIds: {
				feeId: null,
				regId: null,
				mainId: 'e3489d2a52154bb39a569a5b740def51',
			},
			privateAttendance: false,
			regionEventNumber: {
				labels: ['Not Required', 'To Be Applied For', 'Applied For'],
				selection: 0,
				otherValueSelected: false,
			},
			requiredEquipment: [],
			signUpDenyMessage: '',
			limitSignupsToTeam: false,
			lodgingArrangments: {
				labels: [
					'Hotel or individual room',
					'Open bay building',
					'Large tent',
					'Individual tent',
				],
				values: [false, false, false, false],
				otherSelected: false,
			},
			administrationComments: '',
			customAttendanceFields: [],
			transportationProvided: false,
			highAdventureDescription: '',
			transportationDescription: '',
			desiredNumberOfParticipants: 20,
		};

		await expect(
			getAttendanceForEvent(schema)(event).map(collectGeneratorAsync).fullJoin(),
		).resolves.toHaveLength(3);

		done();
	});
});
