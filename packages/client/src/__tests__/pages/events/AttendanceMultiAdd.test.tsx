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

import { render, waitFor } from '@testing-library/react';
import {
	AccountType,
	always,
	APIEither,
	asyncRight,
	AttendanceRecord,
	ClientUser,
	getDefaultMemberPermissions,
	Member,
	MemberCreateError,
	RawResolvedEventObject,
} from 'common-lib';
import { getTestAccount, getTestEvent, getTestMember, getTestRegistry } from 'common-lib/dist/test';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { FetchAPIProvider } from '../../../globals';
import fetchApi, { TFetchAPI } from '../../../lib/apis';
import { clientErrorGenerator } from '../../../lib/error';
import AttendanceMultiAdd from '../../../pages/events/AttendanceMultiAdd';

const testAccount = getTestAccount();
const testRegistry = getTestRegistry(testAccount);
const testEvent: RawResolvedEventObject = {
	...getTestEvent(testAccount),
	pickupDateTime: 1,
};

const testMember1 = getTestMember();
const testUser: ClientUser = {
	...testMember1,
	permissions: getDefaultMemberPermissions(AccountType.CAPSQUADRON),
};

// const testRec = getTestAttendanceRecord(testEvent, testUser);

const routeProps = {
	location: {
		hash: '',
		pathname: '/eventviewer',
		search: '',
		state: {},
	},
	match: {
		params: {
			id: testEvent.id.toString(),
		},
	},
} as RouteComponentProps<{ id: string }>;

describe('EventViewer', () => {
	let portalElement: HTMLDivElement;

	beforeEach(() => {
		portalElement = document.createElement('div');
		portalElement.id = 'dialogue-box';
		document.body.appendChild(portalElement);
	});

	afterEach(() => {
		document.body.removeChild(portalElement);
		portalElement = null!;
	});

	it('should render page', async () => {
		const memberList = jest.fn((() =>
			asyncRight(
				[] as Member[],
				clientErrorGenerator(),
			)) as TFetchAPI['member']['memberList']);
		const getEvent = jest.fn((() =>
			asyncRight(testEvent, clientErrorGenerator())) as TFetchAPI['events']['events']['get']);
		const getAttendance = jest.fn((() =>
			asyncRight(
				[] as APIEither<AttendanceRecord>[],
				clientErrorGenerator(),
			)) as TFetchAPI['events']['attendance']['get']);

		const api: TFetchAPI = {
			...fetchApi,
			events: {
				...fetchApi.events,
				events: {
					...fetchApi.events.events,
					get: getEvent,
				},
				attendance: {
					...fetchApi.events.attendance,
					get: getAttendance,
				},
			},
			member: {
				...fetchApi.member,
				memberList,
			},
		};

		const { container } = render(
			<MemoryRouter>
				<FetchAPIProvider value={{ fetchApi: api, fetchAPIForAccount: always(api) }}>
					<AttendanceMultiAdd
						account={testAccount}
						authorizeUser={() => void 0}
						fullMemberDetails={{
							error: MemberCreateError.INVALID_SESSION_ID,
						}}
						member={testUser}
						prepareURL={() => void 0}
						registry={testRegistry}
						routeProps={routeProps}
						updateApp={() => void 0}
						updateBreadCrumbs={() => void 0}
						updateSideNav={() => void 0}
					/>
				</FetchAPIProvider>
			</MemoryRouter>,
		);

		await waitFor(() => expect(getEvent).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(getAttendance).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(memberList).toHaveBeenCalledTimes(1));

		expect(container.querySelector('#attendancemultiadd-form')).not.toBeNull();
	});
});
