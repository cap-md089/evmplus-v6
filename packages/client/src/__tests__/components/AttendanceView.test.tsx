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

import {
	AccountType,
	AttendanceRecord,
	CAPNHQMemberReference,
	getDefaultMemberPermissions,
	toReference,
} from 'common-lib';
import {
	getTestAccount,
	getTestAttendanceRecord,
	getTestEvent,
	getTestMember,
	getTestRegistry,
} from 'common-lib/dist/test';
import { render } from '@testing-library/react';
import * as React from 'react';
import { AttendanceItemView } from '../../components/AttendanceView';
import fetchApi, { fetchAPIForAccount } from '../../lib/apis';

const testAccount = getTestAccount();
const testEvent = getTestEvent(testAccount);
const testMember1 = {
	...getTestMember(),
	id: 1,
};
// const testMember2 = {
// 	...getTestMember(),
// 	id: 2,
// };
const testRec: AttendanceRecord = {
	...getTestAttendanceRecord(testEvent),
	memberID: toReference(testMember1) as CAPNHQMemberReference,
};
const testUser1 = {
	...testMember1,
	permissions: getDefaultMemberPermissions(AccountType.CAPSQUADRON),
};
// const testUser2 = {
// 	...testMember2,
// 	permissions: getDefaultAdminPermissions(AccountType.CAPSQUADRON),
// };
const testRegistry = getTestRegistry(testAccount);

describe('AttendanceView', () => {
	it('should render without crashing', () => {
		render(
			<AttendanceItemView
				fetchApi={fetchApi}
				fetchAPIForAccount={fetchAPIForAccount}
				attendanceRecord={testRec}
				clearUpdated={() => void 0}
				index={0}
				member={testUser1}
				owningAccount={testAccount}
				owningEvent={testEvent}
				pickupDateTime={testEvent.pickupDateTime}
				registry={testRegistry}
				removeAttendance={() => void 0}
				updateAttendance={() => void 0}
				updated={false}
				recordMember={null}
			/>,
		);
	});
});
