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
	asyncRight,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	errorGenerator,
	getDefaultAdminPermissions,
	RawResolvedEventObject,
} from 'common-lib';
import { getTestAccount, getTestEvent } from 'common-lib/dist/test';
import {
	getCAPWATCHTestData,
	getDbHandle,
	getMemberFromTestData,
	getTestUserForMember,
	setPresetRecords,
} from 'server-jest-config';
import { getDefaultTestBackend } from '../defaultBackends';
import { deleteEvent, getEvent } from '../Event';

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

const member = {
	...getTestUserForMember(getMemberFromTestData({ id: 911111, type: 'CAPNHQMember' })),
	permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
};

const db = {
	...getCAPWATCHTestData(),
	Accounts: [testAccount],
	Events: [testEvent],
};

const testSetup = setPresetRecords(db);

describe('Events', () => {
	const dbRef = getDbHandle();

	beforeAll(dbRef.setup);
	afterAll(dbRef.teardown);

	beforeEach(testSetup(dbRef));

	it('should delete events', async done => {
		const backend = getDefaultTestBackend({
			overrides: {
				removeGoogleCalendarEvents: () => asyncRight(void 0, errorGenerator('huh?')),
			},
		})(dbRef.connection.getSchema());

		const event = await getEvent(dbRef.connection.getSchema())(testAccount)(testEvent.id)
			.flatMap(backend.ensureResolvedEvent)
			.fullJoin();

		const result = await deleteEvent(backend)(dbRef.connection.getSchema())(testAccount)(
			member,
		)(event);

		console.log(result);

		expect(result).toBeRight();

		await expect(
			getEvent(dbRef.connection.getSchema())(testAccount)(testEvent.id)
				.flatMap(backend.ensureResolvedEvent)
				.fullJoin(),
		).resolves.toThrow();

		done();
	});
});
