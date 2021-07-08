/**
 * Copyright (C) 2021 Andrew Rioux
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

import { func } from '../../../../api/events/attendance/deleteattendance';
import { AccountType, api, getDefaultAdminPermissions } from 'common-lib';
import { getTestAccount, getTestEvent, getTestRawAttendanceRecord } from 'common-lib/dist/test';
import {
	getCAPWATCHTestData,
	getDbHandle,
	getMemberFromTestData,
	setPresetRecords,
} from 'server-jest-config';
import { getDefaultTestBackend } from 'server-common';
import { apiURL } from 'auto-client-api';

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
		const backend = getDefaultTestBackend()(dbRef.connection.getSchema());

		console.log(apiURL<api.events.events.Delete>());
	});
});
