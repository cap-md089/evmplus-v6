/**
 * Copyright (C) 2021 Andrew Rioux
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

import { generateRequest } from 'auto-client-api';
import { AccountType, api, Either, getDefaultAdminPermissions } from 'common-lib';
import {
	getTestAccount,
	getTestEvent,
	getTestRawAttendanceRecord,
	getTestSession,
} from 'common-lib/dist/test';
import { getDefaultTestBackend } from 'server-common';
import {
	getCAPWATCHTestData,
	getDbHandle,
	getMemberFromTestData,
	setPresetRecords,
} from 'server-jest-config';
import conf from 'server-jest-config/src/conf';
import { func } from '../../../../api/events/attendance/deleteattendance';

const testAccount = getTestAccount();
const testEvent = getTestEvent(testAccount);
const testMember = getMemberFromTestData({ type: 'CAPNHQMember', id: 911111 });
const testRec = getTestRawAttendanceRecord(testEvent, testMember);
const testUser = {
	...testMember,
	permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
	sessionID: '',
};

const db = {
	...getCAPWATCHTestData(),
	Accounts: [testAccount],
	Attendance: [testRec],
	Events: [testEvent],
};

const testSetup = setPresetRecords(db);

describe('DELETE api/events/attendance', () => {
	const dbRef = getDbHandle();

	beforeAll(dbRef.setup);
	afterAll(dbRef.teardown);

	beforeEach(testSetup(dbRef));

	it('should delete an attendance record', async () => {
		const request = generateRequest<api.events.attendance.Delete>(
			dbRef.connection,
			testAccount,
			{ id: testEvent.id.toString() },
			{ member: testRec.memberID },
			conf(dbRef.connection),
			testUser,
			getTestSession(testUser),
		);

		const backend = getDefaultTestBackend()(dbRef.connection.getSchema());

		await expect(func(backend)(request)).resolves.toMatchObject(Either.right({}));

		expect(
			(
				await dbRef.connection
					.getSchema()
					.getCollection('Attendance')
					.find('true')
					.execute()
			).fetchAll(),
		).toHaveLength(0);
	});
});
