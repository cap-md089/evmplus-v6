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
	AccountType,
	always,
	applyCustomAttendanceFields,
	areMembersTheSame,
	collectGeneratorAsync,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	Either,
	getDefaultAdminPermissions,
	getDefaultMemberPermissions,
	getDefaultStaffPermissions,
	getFullMemberName,
	RawAttendanceDBRecord,
	RawResolvedEventObject,
} from 'common-lib';
import { getTestAccount, getTestEvent, getTestRawAttendanceRecord } from 'common-lib/dist/test';
import {
	getCAPWATCHTestData,
	getDbHandle,
	getMemberFromTestData,
	getTestUserForMember,
	setPresetRecords,
	TestConnection,
} from 'server-jest-config';
import {
	applyAttendanceFilter,
	attendanceRecordMapper,
	canMemberDeleteRecord,
	canMemberModifyRecord,
	deleteAttendanceRecord,
	getAttendanceForEvent,
} from '../Attendance';
import { getDefaultTestBackend } from '../defaultBackends';
import { resolveReference } from '../Members';

const testAccount = getTestAccount();

const displayedCustomAttendanceField: CustomAttendanceField = {
	type: CustomAttendanceFieldEntryType.CHECKBOX,
	allowMemberToModify: true,
	displayToMember: true,
	preFill: false,
	title: 'field 1',
};
const hiddenCustomAttendanceField: CustomAttendanceField = {
	type: CustomAttendanceFieldEntryType.CHECKBOX,
	allowMemberToModify: true,
	displayToMember: false,
	preFill: false,
	title: 'field 2',
};

const testEvent: RawResolvedEventObject = {
	...getTestEvent(testAccount),
	endDateTime: 1,
	customAttendanceFields: [displayedCustomAttendanceField, hiddenCustomAttendanceField],
};

const testRec1 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911111, type: 'CAPNHQMember' as const },
	memberName: getFullMemberName(getMemberFromTestData({ id: 911111, type: 'CAPNHQMember' })),
	customAttendanceFieldValues: applyCustomAttendanceFields(testEvent.customAttendanceFields)([]),
};
const testRec2 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911112, type: 'CAPNHQMember' as const },
	memberName: getFullMemberName(getMemberFromTestData({ id: 911112, type: 'CAPNHQMember' })),
	customAttendanceFieldValues: applyCustomAttendanceFields(testEvent.customAttendanceFields)([]),
};
const testRec3 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911113, type: 'CAPNHQMember' as const },
	memberName: getFullMemberName(getMemberFromTestData({ id: 911113, type: 'CAPNHQMember' })),
	customAttendanceFieldValues: applyCustomAttendanceFields(testEvent.customAttendanceFields)([]),
};

const db = {
	...getCAPWATCHTestData(),
	Accounts: [testAccount],
	Events: [testEvent],
	Attendance: [testRec1, testRec2, testRec3],
};

const testSetup = setPresetRecords(db);

const removeHiddenAttendanceFields = (event: RawResolvedEventObject) => (
	record: RawAttendanceDBRecord,
) =>
	attendanceRecordMapper({
		...record,
		customAttendanceFieldValues: record.customAttendanceFieldValues.filter(
			fieldValue =>
				!!event.customAttendanceFields.find(field => field.title === fieldValue.title)
					?.displayToMember,
		),
	});

describe('Attendance', () => {
	jest.setTimeout(15000);

	const dbref = getDbHandle();

	beforeAll(TestConnection.setup(dbref));
	afterAll(TestConnection.teardown(dbref));

	beforeEach(testSetup(dbref));

	it('should get all attendance for event', async done => {
		const schema = dbref.connection.getSchema();
		await expect(
			getAttendanceForEvent(schema)(testEvent).map(collectGeneratorAsync).fullJoin(),
		).resolves.toHaveLength(3);
		done();
	});
	it('default member can view own attendance record', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getMemberFromTestData(testRec1.memberID);

		await expect(
			getAttendanceForEvent(schema)(testEvent)
				.map(
					applyAttendanceFilter(backend)({
						...member,
						permissions: getDefaultMemberPermissions(AccountType.CAPSQUADRON),
						sessionID: '',
					}),
				)
				.map(collectGeneratorAsync)
				.fullJoin(),
		).resolves.toContainEqual(removeHiddenAttendanceFields(testEvent)(testRec1));
		done();
	});
	it('cadet staff can view own attendance record', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getMemberFromTestData(testRec1.memberID);

		await expect(
			getAttendanceForEvent(schema)(testEvent)
				.map(
					applyAttendanceFilter(backend)({
						...member,
						permissions: getDefaultStaffPermissions(AccountType.CAPSQUADRON),
						sessionID: '',
					}),
				)
				.map(collectGeneratorAsync)
				.fullJoin(),
		).resolves.toContainEqual(removeHiddenAttendanceFields(testEvent)(testRec1));
		done();
	});
	it('admin member can view own attendance record', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = await resolveReference(schema)(backend)(testAccount)(
			testRec1.memberID,
		).fullJoin();

		await expect(
			getAttendanceForEvent(schema)(testEvent)
				.map(
					applyAttendanceFilter(backend)({
						...member,
						permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
						sessionID: '',
					}),
				)
				.map(collectGeneratorAsync)
				.fullJoin(),
		).resolves.toContainEqual(attendanceRecordMapper(testRec1));
		done();
	});
	it('can edit own attendance record before event end time', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend({
			now: always(0),
		})(schema);
		const member = getTestUserForMember(getMemberFromTestData(testRec1.memberID));

		await expect(
			canMemberModifyRecord(backend)(member)(attendanceRecordMapper(testRec1)),
		).resolves.toEqual(Either.right(true));
		done();
	});
	it('default member cannot edit own attendance record after event end time', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend({
			now: always(2),
		})(schema);
		const member = getTestUserForMember(getMemberFromTestData(testRec1.memberID));

		await expect(
			canMemberModifyRecord(backend)(member)(attendanceRecordMapper(testRec1)),
		).resolves.toEqual(Either.right(false));
		done();
	});
	it('admin can edit own attendance record after event end time', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend({
			now: always(2),
		})(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec1.memberID)),
			permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		};

		await expect(
			canMemberModifyRecord(backend)(member)(attendanceRecordMapper(testRec1)),
		).resolves.toEqual(Either.right(true));
		done();
	});
	it('can show custom attendance fields of other attendees to admins', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec1.memberID)),
			permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		};

		const attendanceRecords = await getAttendanceForEvent(schema)(testEvent)
			.map(applyAttendanceFilter(backend)(member))
			.map(collectGeneratorAsync)
			.fullJoin();

		expect(attendanceRecords.length).not.toEqual(0);

		for (const record of attendanceRecords) {
			expect(record.customAttendanceFieldValues.length).toEqual(2);
		}

		done();
	});
	it('shows the appropriate custom attendance fields', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec2.memberID)),
		};

		const attendanceRecords = await getAttendanceForEvent(schema)(testEvent)
			.map(applyAttendanceFilter(backend)(member))
			.map(collectGeneratorAsync)
			.fullJoin();

		expect(attendanceRecords.length).not.toEqual(0);

		for (const record of attendanceRecords) {
			if (!areMembersTheSame(record.memberID)(member)) {
				expect(record.customAttendanceFieldValues.length).toEqual(0);
			} else {
				// One hidden, one shown
				expect(record.customAttendanceFieldValues.length).toEqual(1);
			}
		}

		done();
	});
	it('can view grades/names of other attendees', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getMemberFromTestData(testRec1.memberID);

		const attendanceRecords = await getAttendanceForEvent(schema)(testEvent)
			.map(
				applyAttendanceFilter(backend)({
					...member,
					permissions: getDefaultMemberPermissions(AccountType.CAPSQUADRON),
					sessionID: '',
				}),
			)
			.map(collectGeneratorAsync)
			.fullJoin();

		expect(attendanceRecords.length).not.toEqual(0);

		for (const record of attendanceRecords) {
			expect(record.memberName).not.toEqual('');
		}

		done();
	});
	it('default member cannot edit other attendees attendance records', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getTestUserForMember(getMemberFromTestData(testRec1.memberID));

		await expect(
			canMemberModifyRecord(backend)(member)(attendanceRecordMapper(testRec2)),
		).resolves.toEqual(Either.right(false));
		done();
	});
	it('default member cannot delete personal attendance records', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getTestUserForMember(getMemberFromTestData(testRec1.memberID));

		await expect(
			canMemberDeleteRecord(backend)(member)(attendanceRecordMapper(testRec2)),
		).resolves.toEqual(Either.right(false));
		done();
	});
	it('admin can delete other attendees attendance records', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec1.memberID)),
			permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		};

		await expect(
			canMemberDeleteRecord(backend)(member)(attendanceRecordMapper(testRec2)),
		).resolves.toEqual(Either.right(true));
		done();
	});
	it('admin can delete other attendees attendance records', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec1.memberID)),
			permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		};

		await expect(
			canMemberDeleteRecord(backend)(member)(attendanceRecordMapper(testRec2)),
		).resolves.toEqual(Either.right(true));
		done();
	});
	it('should delete an attendance record', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = {
			...getTestUserForMember(getMemberFromTestData(testRec1.memberID)),
			permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
		};

		await expect(
			deleteAttendanceRecord(backend)(member)(testRec2.memberID)(testEvent),
		).resolves.toMatchObject(Either.right({}));

		const records = (
			await dbref.connection
				.getSchema()
				.getCollection<RawAttendanceDBRecord>('Attendance')
				.find('true')
				.execute()
		).fetchAll();

		for (const rec of records) {
			expect(rec.memberID).not.toMatchObject(testRec2.memberID);
		}

		done();
	});
});
