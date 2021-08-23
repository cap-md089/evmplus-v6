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

import { generateRequest } from 'auto-client-api';
import { AccountType, api, Either, getDefaultAdminPermissions } from 'common-lib';
import { getTestAccount, getTestEvent, getTestSession } from 'common-lib/dist/test';
import { getDefaultTestBackend } from 'server-common';
import {
	getCAPWATCHTestData,
	getDbHandle,
	getMemberFromTestData,
	setPresetRecords,
} from 'server-jest-config';
import conf from 'server-jest-config/src/conf';
import { func } from '../../../../api/events/events/deleteevent';

const testAccount = getTestAccount();
const testEvent = getTestEvent(testAccount);
const testMember = getMemberFromTestData({ type: 'CAPNHQMember', id: 911111 });
const testUser = {
	...testMember,
	permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
	sessionID: '',
};

const db = {
	...getCAPWATCHTestData(),
	Accounts: [testAccount],
	Events: [testEvent],
};

const testSetup = setPresetRecords(db);

describe('DELETE api/events/attendance', () => {
	const dbRef = getDbHandle();

	beforeAll(dbRef.setup);
	afterAll(dbRef.teardown);

	beforeEach(testSetup(dbRef));

	it('should delete an event', async () => {
		const request = generateRequest<api.events.events.Delete>(
			dbRef.connection,
			testAccount,
			{ id: testEvent.id.toString() },
			{},
			conf(dbRef.connection),
			testUser,
			getTestSession(testUser),
		);

		const backend = getDefaultTestBackend()(dbRef.connection.getSchema());

        const result = await func(backend)(request);

        console.log(result);

		expect(result).toBeRight();

		expect(
			(
				await dbRef.connection.getSchema().getCollection('Events').find('true').execute()
			).fetchAll(),
		).toHaveLength(0);
	});
});
