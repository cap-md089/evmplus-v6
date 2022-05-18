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

import { fireEvent, render } from '@testing-library/react';
import {
	AccountType,
	asyncRight,
	AttendanceRecord,
	AttendanceStatus,
	CAPNHQMemberReference,
	getDefaultMemberPermissions,
	MemberCreateError,
	toReference,
} from 'common-lib';
import {
	getTestAccount,
	getTestAttendanceRecord,
	getTestEvent,
	getTestMember,
	getTestRegistry,
} from 'common-lib/dist/test';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import AttendanceForm from '../../../components/forms/usable-forms/AttendanceForm';
import { FetchAPIProvider } from '../../../globals';
import fetchApi, { fetchAPIForAccount, TFetchAPI } from '../../../lib/apis';
import { clientErrorGenerator } from '../../../lib/error';

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

const testSigninReturn1 = {
	error: MemberCreateError.NONE,
	member: testUser1,
	notificationCount: 0,
	taskCount: 0,
	linkableAccounts: [],
	requirementTags: [],
};

describe('AttendanceView', () => {
	it('should render without crashing', () => {
		act(() => {
			render(
				<AttendanceForm
					fetchAPIForAccount={fetchAPIForAccount}
					fetchApi={fetchApi}
					account={testAccount}
					event={testEvent}
					member={testUser1}
					fullMember={testSigninReturn1}
					updateRecord={() => void 0}
					updated={false}
					clearUpdated={() => void 0}
					removeRecord={() => void 0}
					signup={true}
					registry={testRegistry}
				/>,
			);
		});
	});

	it('should try to add a record when the Sign Up button is clicked', () => {
		const add = jest.fn((() =>
			asyncRight(
				testRec,
				clientErrorGenerator(),
			)) as TFetchAPI['events']['attendance']['add']);

		const api: TFetchAPI = {
			...fetchApi,
			events: {
				...fetchApi.events,
				attendance: {
					...fetchApi.events.attendance,
					add,
				},
			},
		};

		const { container } = render(
			<FetchAPIProvider
				value={{
					fetchApi: api,
					fetchAPIForAccount: () => api,
				}}
			>
				<AttendanceForm
					account={testAccount}
					event={testEvent}
					member={testUser1}
					fullMember={testSigninReturn1}
					updateRecord={() => void 0}
					updated={false}
					clearUpdated={() => void 0}
					removeRecord={() => void 0}
					signup={true}
					registry={testRegistry}
				/>
			</FetchAPIProvider>,
		);

		act(() => {
			const input = container.querySelector('input.submit')!;
			fireEvent.submit(input);
		});

		expect(add.mock.calls[0]).toEqual([
			{ id: testEvent.id.toString() },
			{
				comments: '',
				shiftTime: null,
				planToUseCAPTransportation: testEvent.transportationProvided,
				status: AttendanceStatus.COMMITTEDATTENDED,
				customAttendanceFieldValues: [],
				memberID: toReference(testUser1),
			},
		]);
	});
});
