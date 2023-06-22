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

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import {
	AccountType,
	always,
	api as TApi,
	asyncRight,
	AttendanceStatus,
	ClientUser,
	getDefaultMemberPermissions,
	Maybe,
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
import { RouteComponentProps } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { FetchAPIProvider } from '../../../globals';
import fetchApi, { TFetchAPI } from '../../../lib/apis';
import { clientErrorGenerator } from '../../../lib/error';
import EventViewer from '../../../pages/events/EventViewer';

const testAccount = getTestAccount();
const testRegistry = getTestRegistry(testAccount);
const testEvent = {
	...getTestEvent(testAccount),
	pickupDateTime: 1,
};

const testMember1 = getTestMember();
const testUser: ClientUser = {
	...testMember1,
	permissions: getDefaultMemberPermissions(AccountType.CAPSQUADRON),
};

const testRec = getTestAttendanceRecord(testEvent, testUser);

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

const testSigninReturn1 = {
	error: MemberCreateError.NONE,
	member: testUser,
	notificationCount: 0,
	taskCount: 0,
	linkableAccounts: [],
	requirementTags: [],
};

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

	it('should fetch event viewer data', async () => {
		const add = jest.fn((() =>
			asyncRight(
				testRec,
				clientErrorGenerator(),
			)) as TFetchAPI['events']['attendance']['add']);

		const getViewerData = jest.fn((() =>
			asyncRight(
				{
					attendees: [],
					authorFullName: Maybe.none(),
					event: testEvent,
					linkedEvents: [],
					pointsOfContact: [],
				} as TApi.events.events.EventViewerData,
				clientErrorGenerator(),
			)) as TFetchAPI['events']['events']['getViewerData']);

		const api: TFetchAPI = {
			...fetchApi,
			events: {
				...fetchApi.events,
				events: {
					...fetchApi.events.events,
					getViewerData,
				},
				attendance: {
					...fetchApi.events.attendance,
					add,
				},
			},
		};

		const { container } = render(
			<MemoryRouter>
				<FetchAPIProvider value={{ fetchApi: api, fetchAPIForAccount: always(api) }}>
					<EventViewer
						account={testAccount}
						authorizeUser={() => void 0}
						fullMemberDetails={testSigninReturn1}
						member={testUser}
						prepareURL={() => void 0}
						registry={testRegistry}
						routeProps={routeProps}
						updateApp={() => void 0}
						updateBreadCrumbs={() => void 0}
						updateSideNav={() => void 0}
						deleteReduxState={() => void 0}
					/>
				</FetchAPIProvider>
			</MemoryRouter>,
		);

		await waitFor(() => expect(getViewerData).toHaveBeenCalledTimes(1));

		expect(container.querySelector('#information')).not.toBeNull();
	});

	it('should sign up for events', async () => {
		const add = jest.fn((() =>
			asyncRight(
				testRec,
				clientErrorGenerator(),
			)) as TFetchAPI['events']['attendance']['add']);

		const getViewerData = jest.fn((() =>
			asyncRight(
				{
					attendees: [],
					authorFullName: Maybe.none(),
					event: testEvent,
					linkedEvents: [],
					pointsOfContact: [],
				} as TApi.events.events.EventViewerData,
				clientErrorGenerator(),
			)) as TFetchAPI['events']['events']['getViewerData']);

		const api: TFetchAPI = {
			...fetchApi,
			events: {
				...fetchApi.events,
				events: {
					...fetchApi.events.events,
					getViewerData,
				},
				attendance: {
					...fetchApi.events.attendance,
					add,
				},
			},
		};

		const { container } = render(
			<MemoryRouter>
				<FetchAPIProvider value={{ fetchApi: api, fetchAPIForAccount: always(api) }}>
					<EventViewer
						account={testAccount}
						authorizeUser={() => void 0}
						fullMemberDetails={testSigninReturn1}
						member={testUser}
						prepareURL={() => void 0}
						registry={testRegistry}
						routeProps={routeProps}
						updateApp={() => void 0}
						updateBreadCrumbs={() => void 0}
						updateSideNav={() => void 0}
						now={always(0)}
						deleteReduxState={() => void 0}
					/>
				</FetchAPIProvider>
			</MemoryRouter>,
		);

		await waitFor(() => expect(getViewerData).toHaveBeenCalledTimes(1));

		const input = container.querySelector('input[type=submit]')!;

		act(() => {
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
				memberID: toReference(testMember1),
			},
		]);

		await waitFor(() => expect(getViewerData).toHaveBeenCalledTimes(1));
	});
});
