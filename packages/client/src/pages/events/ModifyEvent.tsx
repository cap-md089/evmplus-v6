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

/* export default class ModifyEvent extends Page<PageProps<{ id: string }>, ModifyEventState> {
	public state: ModifyEventState = {
		stage: 'LOADING',

		saving: false,
	};

	public async componentDidMount(): Promise<void> {
		if (!this.props.member) {
			return;
		}

		const infoEither = await AsyncEither.All([
			fetchApi.events.events.get(
				{ id: this.props.routeProps.match.params.id.split('-')[0] },
				{},
			),
			fetchApi.member.memberList({}, {}),
			fetchApi.team.list({}, {}),
		]);

		if (Either.isLeft(infoEither)) {
			return this.setState({
				stage: 'ERROR',
				errorMessage: 'Could not load event information',

				saving: false,
			});
		}

		const [event, memberList, teamList] = infoEither.value;

		if (
			effectiveManageEventPermissionForEvent(this.props.member)(event) ===
			Permissions.ManageEvent.NONE
		) {
			return this.setState({
				stage: 'ERROR',
				errorMessage: 'You do not have permission to modify this event',

				saving: false,
			});
		}

		this.setState(prev => ({
			...prev,

			stage: 'LOADED',
			event,
			memberList,
			teamList,
			eventFormValues: convertToFormValues(event),
		}));

		this.props.updateBreadCrumbs([
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

		this.props.updateSideNav([
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

		this.updateTitle(`Modify event "${event.name}"`);
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <SigninLink>Please sign in</SigninLink>;
		}

		if (this.state.stage === 'LOADING') {
			return <Loader />;
		}

		if (this.state.stage === 'ERROR') {
			return <div>{this.state.errorMessage}</div>;
		}

		return (
			<EventForm
				account={this.props.account}
				// Create a copy so that the form doesn't modify the reference
				event={this.state.eventFormValues}
				isEventUpdate={true}
				member={this.props.member}
				onEventChange={this.updateNewEvent}
				onEventFormSubmit={this.handleSubmit}
				registry={this.props.registry}
				teamList={this.state.teamList}
				memberList={this.state.memberList}
				saving={this.state.saving}
			/>
		);
	}

	private updateNewEvent = (eventFormValues: NewEventFormValues): void => {
		if (this.state.stage !== 'LOADED') {
			return;
		}

		this.setState(prev => ({
			...prev,
			eventFormValues,
		}));
	};

	private handleSubmit = async (event: MaybeObj<NewEventFormValues>): Promise<void> => {
		if (!this.props.member) {
			return;
		}

		if (this.state.stage !== 'LOADED') {
			return;
		}

		const properEventValues = Maybe.flatMap(convertFormValuesToEvent)(event);

		if (!properEventValues.hasValue) {
			return;
		}

		this.setState({
			saving: true,
		});

		const resultEither = await fetchApi.events.events.set(
			{ id: this.props.routeProps.match.params.id.split('-')[0] },
			properEventValues.value,
		);

		if (Either.isLeft(resultEither)) {
			this.setState({
				saving: false,
				stage: 'ERROR',
				errorMessage: 'Could not save event information',
			});
		} else {
			this.props.routeProps.history.push(
				`/eventviewer/${this.props.routeProps.match.params.id.split('-')[0]}`,
			);
		}
	};
}
*/
