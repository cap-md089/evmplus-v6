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

import { collectGeneratorAsync } from 'common-lib';
import { getTestEvent, getTestRawAttendanceRecord } from 'common-lib/dist/test';
import { getDbHandle, setPresetRecords, TestConnection } from 'server-jest-config';
import { getAttendanceForEvent } from '../Attendance';

const testEvent = getTestEvent();

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
	it('should get all attendance for event', async done => {
		const schema = dbref.connection.getSchema();
		await expect(
			getAttendanceForEvent(schema)(testEvent).map(collectGeneratorAsync).fullJoin(),
		).resolves.toHaveLength(3);
		done();
	});
	it('should get all attendance for event', async done => {
		const schema = dbref.connection.getSchema();
		await expect(
			getAttendanceForEvent(schema)(testEvent).map(collectGeneratorAsync).fullJoin(),
		).resolves.toHaveLength(3);
		done();
	});
	it('should get all attendance for event', async done => {
		const schema = dbref.connection.getSchema();
		await expect(
			getAttendanceForEvent(schema)(testEvent).map(collectGeneratorAsync).fullJoin(),
		).resolves.toHaveLength(3);
		done();
	});
});
