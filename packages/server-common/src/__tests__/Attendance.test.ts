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
	collectGeneratorAsync,
	getDefaultAdminPermissions,
	getDefaultMemberPermissions,
	getDefaultStaffPermissions,
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
	getAttendanceForEvent,
} from '../Attendance';
import { getDefaultTestBackend } from '../defaultBackends';
import { resolveReference } from '../Members';

const testAccount = getTestAccount();

const testEvent = {
	...getTestEvent(testAccount),
	endDateTime: 1,
};

const testRec1 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911111, type: 'CAPNHQMember' as const },
};
const testRec2 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911112, type: 'CAPNHQMember' as const },
};
const testRec3 = {
	...getTestRawAttendanceRecord(testEvent),
	memberID: { id: 911113, type: 'CAPNHQMember' as const },
};

const testSetup = setPresetRecords({
	...getCAPWATCHTestData(),
	Events: [testEvent],
	Attendance: [testRec1, testRec2, testRec3],
});

describe('Attendance', () => {
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
		const member = await resolveReference(schema)(backend)(testAccount)(
			testRec1.memberID,
		).fullJoin();

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
		).resolves.toContainEqual(testRec1);
		done();
	});
	it('cadet staff can view own attendance record', async done => {
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
						permissions: getDefaultStaffPermissions(AccountType.CAPSQUADRON),
						sessionID: '',
					}),
				)
				.map(collectGeneratorAsync)
				.fullJoin(),
		).resolves.toContainEqual(testRec1);
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
		).resolves.toContainEqual(testRec1);
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
		).resolves.toEqualRight(true);
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
		).resolves.toEqualRight(false);
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
		).resolves.toEqualRight(true);
		done();
	});
	it('can view grades/names of other attendees', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = await resolveReference(schema)(backend)(testAccount)(
			testRec1.memberID,
		).fullJoin();

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
		).resolves.toEqualRight(false);
		done();
	});
	it('default member cannot edit other attendees attendance records', async done => {
		const schema = dbref.connection.getSchema();
		const backend = getDefaultTestBackend()(schema);
		const member = getTestUserForMember(getMemberFromTestData(testRec1.memberID));

		await expect(
			canMemberModifyRecord(backend)(member)(attendanceRecordMapper(testRec2)),
		).resolves.toEqualRight(false);
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
		).resolves.toEqualRight(true);
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
		).resolves.toEqualRight(true);
		done();
	});
});
