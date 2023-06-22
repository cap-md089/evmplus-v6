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
	AsyncEither,
	Either,
	Maybe,
	MaybeObj,
	Permissions,
	effectiveManageEventPermissionForEvent,
} from 'common-lib';
import React, { ReactElement, useCallback, useEffect } from 'react';
import EventForm, {
	NewEventFormValues,
	convertFormValuesToEvent,
} from '../../components/forms/usable-forms/EventForm';
import { useAppDispatch, useAppSelector } from '../../hooks';
import fetchApi from '../../lib/apis';
import {
	PageDispatch,
	getPageState,
	loadPage,
	modifyEventPageAction,
	usePageDispatch,
} from '../../state/pageState';
import {
	ModifyEventState,
	setErrorInfo,
	setLoadedInformation,
	startSaving,
	updateFormValues,
} from '../../state/pages/modifyevent';
import { goToSignin } from '../../state/pages/signin';
import { PageProps } from '../Page';
import Loader from '../../components/Loader';

const defaultPageState: ModifyEventState = {
	data: { state: 'LOADING' },
	saving: false,
};

export default ({
	member,
	routeProps,
	registry,
	updateSideNav,
	updateBreadCrumbs,
	account,
}: PageProps<{ id: string }>): ReactElement | null => {
	const appDispatch = useAppDispatch();
	const currentPage = useAppSelector(getPageState);

	const dispatch = usePageDispatch(modifyEventPageAction);

	const loadMemberTeamsInfo = useCallback(
		async (pageDispatch: PageDispatch): Promise<void> => {
			if (!member) {
				return;
			}

			const infoEither = await AsyncEither.All([
				fetchApi.events.events.get({ id: routeProps.match.params.id.split('-')[0] }, {}),
				fetchApi.member.memberList({}, {}),
				fetchApi.team.list({}, {}),
			]);

			if (Either.isLeft(infoEither)) {
				return pageDispatch(setErrorInfo('Could not load event information'));
			}

			const event = infoEither.value[0];

			if (
				effectiveManageEventPermissionForEvent(member)(event) ===
				Permissions.ManageEvent.NONE
			) {
				return pageDispatch(
					setErrorInfo('You do not have permission to modify this event'),
				);
			}

			pageDispatch(setLoadedInformation(infoEither.value));

			updateBreadCrumbs([
				{
					target: '/',
					text: 'Home',
				},
				{
					target: `/eventviewer/${event.id}`,
					text: `View event "${event.name}"`,
				},
				{
					target: `/eventform/${event.id}`,
					text: `Modify event "${event.name}"`,
				},
			]);

			updateSideNav([
				{
					target: 'main-information',
					text: 'Main information',
					type: 'Reference',
				},
				{
					target: 'activity-information',
					text: 'Activity Information',
					type: 'Reference',
				},
				{
					target: 'logistics-information',
					text: 'Logistics Information',
					type: 'Reference',
				},
				{
					target: 'points-of-contact',
					text: 'Points of Contact',
					type: 'Reference',
				},
				{
					target: 'custom-attendance-fields',
					text: 'Custom Attendance Fields',
					type: 'Reference',
				},
				{
					target: 'file-attachments',
					text: 'File Attachments',
					type: 'Reference',
				},
				{
					target: 'extra-information',
					text: 'Extra Information',
					type: 'Reference',
				},
				{
					target: 'team-information',
					text: 'Team Information',
					type: 'Reference',
				},
			]);

			document.title = `${[registry.Website.Name, 'Create event'].join(
				` ${registry.Website.Separator} `,
			)}`;
		},
		[member],
	);

	useEffect(() => {
		if (!member) {
			return goToSignin(appDispatch, routeProps);
		}

		if (currentPage.page !== 'modifyevent' || currentPage.state.data.state === 'LOADED') {
			return;
		}

		void loadMemberTeamsInfo(dispatch);
	}, [currentPage.page]);

	const updateEvent = useCallback(
		formValues => {
			dispatch(updateFormValues(formValues));
		},
		[dispatch],
	);

	const handleSubmit = useCallback(
		async (maybeEvent: MaybeObj<NewEventFormValues>): Promise<void> => {
			const maybeFullEvent = Maybe.flatMap(convertFormValuesToEvent)(maybeEvent);

			if (!maybeFullEvent.hasValue) {
				return;
			}

			dispatch(startSaving());

			const createResult = await fetchApi.events.events.set(
				{ id: routeProps.match.params.id.split('-')[0] },
				maybeFullEvent.value,
			);

			if (Either.isLeft(createResult)) {
				if (createResult.value.code >= 400 && createResult.value.code < 500) {
					goToSignin(appDispatch, routeProps);
				} else {
					dispatch(setErrorInfo(createResult.value.message));
				}
			} else {
				routeProps.history.push(`/eventviewer/${routeProps.match.params.id.split('-')[0]}`);
			}
		},
		[dispatch, appDispatch, routeProps],
	);

	if (currentPage.page !== 'modifyevent') {
		appDispatch(loadPage({ page: 'modifyevent', state: defaultPageState }));
		return null;
	}

	if (!member) {
		return null;
	}

	const state = currentPage.state.data;
	const saving = currentPage.state.saving;

	if (state.state === 'LOADING') {
		return <Loader />;
	}

	if (state.state === 'ERROR') {
		return <div>{state.message}</div>;
	}

	return (
		<EventForm
			account={account}
			member={member}
			event={state.eventFormValues}
			saving={saving}
			isEventUpdate={true}
			onEventChange={updateEvent}
			onEventFormSubmit={handleSubmit}
			registry={registry}
			memberList={state.memberList}
			teamList={state.teamList}
		/>
	);
};
