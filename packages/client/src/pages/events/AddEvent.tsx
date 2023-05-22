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
	effectiveManageEventPermission,
} from 'common-lib';
import React, { useCallback, useEffect } from 'react';
import Loader from '../../components/Loader';
import EventForm, {
	NewEventFormValues,
	convertFormValuesToEvent,
} from '../../components/forms/usable-forms/EventForm';
import { useAppDispatch, useAppSelector } from '../../hooks';
import fetchApi from '../../lib/apis';
import {
	PageDispatch,
	addEventPageAction,
	getPageState,
	loadPage,
	usePageDispatch,
} from '../../state/pageState';
import {
	AddEventState,
	setErrorInfo,
	setLoadedInformation,
	startSaving,
	updateFormValues,
} from '../../state/pages/addevent';
import { goToSignin } from '../../state/pages/signin';
import { PageProps } from '../Page';

const defaultPageState: AddEventState = {
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
}: PageProps): React.ReactElement | null => {
	const appDispatch = useAppDispatch();
	const currentPage = useAppSelector(getPageState);

	const dispatch = usePageDispatch(addEventPageAction);

	const loadMemberTeamsInfo = useCallback(async (pageDispatch: PageDispatch): Promise<void> => {
		const infoEither = await AsyncEither.All([
			fetchApi.member.memberList({}, {}),
			fetchApi.team.list({}, {}),
		]);

		if (Either.isLeft(infoEither)) {
			return pageDispatch(setErrorInfo('Could not load member or team information'));
		}

		pageDispatch(setLoadedInformation(infoEither.value));

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
		updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/calendar',
				text: 'Calendar',
			},
			{
				target: '/eventform',
				text: 'Create event',
			},
		]);
		document.title = `${[registry.Website.Name, 'Create event'].join(
			` ${registry.Website.Separator} `,
		)}`;
	}, []);

	useEffect(() => {
		if (!member) {
			return goToSignin(appDispatch, routeProps);
		}

		if (effectiveManageEventPermission(member) === Permissions.ManageEvent.NONE) {
			return;
		}

		if (currentPage.page !== 'addevent' || currentPage.state.data.state === 'LOADED') {
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

	const submitEvent = useCallback(
		async (maybeEvent: MaybeObj<NewEventFormValues>) => {
			const maybeFullEvent = Maybe.flatMap(convertFormValuesToEvent)(maybeEvent);

			if (!maybeFullEvent.hasValue) {
				return;
			}

			dispatch(startSaving());

			const createResult = await fetchApi.events.events.add({}, maybeFullEvent.value);

			if (Either.isLeft(createResult)) {
				if (createResult.value.code >= 400 && createResult.value.code < 500) {
					goToSignin(appDispatch, routeProps);
				} else {
					dispatch(setErrorInfo(createResult.value.message));
				}
			} else {
				routeProps.history.push(`/eventviewer/${createResult.value.id}`);
			}
		},
		[dispatch, appDispatch, routeProps],
	);

	if (currentPage.page !== 'addevent') {
		appDispatch(loadPage({ page: 'addevent', state: defaultPageState }));
		return null;
	}

	if (!member) {
		return null;
	}

	if (effectiveManageEventPermission(member) === Permissions.ManageEvent.NONE) {
		return <div>You do not have permission to do that</div>;
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
			event={state.event}
			saving={saving}
			isEventUpdate={false}
			onEventChange={updateEvent}
			onEventFormSubmit={submitEvent}
			registry={registry}
			memberList={state.memberList}
			teamList={state.teamList}
		/>
	);
};
