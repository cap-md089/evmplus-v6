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
	EchelonEventNumber,
	effectiveManageEventPermissionForEvent,
	Either,
	EventStatus,
	EventType,
	labels,
	Maybe,
	MaybeObj,
	Permissions,
	RadioReturnWithOther,
	RawResolvedEventObject,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Dialogue, { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButtonForm from '../../components/dialogues/DialogueButtonForm';
import EnumRadioButton from '../../components/form-inputs/EnumRadioButton';
import { Label } from '../../components/forms/SimpleForm';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';
import './EventLinkList.css';

interface EventLinkListLoadingState {
	state: 'LOADING';
}

interface EventLinkListLoadedState {
	state: 'LOADED';

	events: RawResolvedEventObject[];
	eventsThatAreLinked: RawResolvedEventObject[];
	eventToSet: string;
}

interface EventLinkListErrorState {
	state: 'ERROR';

	message: string;
}

interface EventLinkListStatusState {
	newStatus: EventStatus;
	statusSetError: MaybeObj<string>;
}

type EventLinkListState = (
	| EventLinkListErrorState
	| EventLinkListLoadedState
	| EventLinkListLoadingState
) &
	EventLinkListStatusState;

function getEventStatusColored(status: EventStatus): JSX.Element {
	switch (status) {
		case EventStatus.COMPLETE:
			return <span style={{ color: 'green' }}>Complete</span>;
		case EventStatus.CANCELLED:
			return <span style={{ color: 'red' }}>Cancelled</span>;
		case EventStatus.CONFIRMED:
			return <span style={{ color: 'magenta' }}>Confirmed</span>;
		case EventStatus.DRAFT:
			return <span style={{ color: '#bb0' }}>Draft</span>;
		case EventStatus.INFORMATIONONLY:
			return <span style={{ color: 'blue' }}>Info Only</span>;
		case EventStatus.TENTATIVE:
			return <span style={{ color: 'orange' }}>Tentative</span>;
	}
}

function getEventStatus(status: EventStatus): string {
	switch (status) {
		case EventStatus.COMPLETE:
			return 'Complete';
		case EventStatus.CANCELLED:
			return 'Cancelled';
		case EventStatus.CONFIRMED:
			return 'Confirmed';
		case EventStatus.DRAFT:
			return 'Draft';
		case EventStatus.INFORMATIONONLY:
			return 'Info Only';
		case EventStatus.TENTATIVE:
			return 'Tentative';
	}
}

function getEventNumber(gen: RadioReturnWithOther<EchelonEventNumber>): JSX.Element | null {
	if (gen.otherValueSelected) {
		return <span style={{ color: 'green' }}>{gen.otherValue}</span>;
	}

	switch (gen.selection) {
		case EchelonEventNumber.NOT_REQUIRED:
			return <span style={{ color: 'green' }}>N/R</span>;
		case EchelonEventNumber.TO_BE_APPLIED_FOR:
			return <span style={{ color: 'blue' }}>Required</span>;
		case EchelonEventNumber.APPLIED_FOR:
			return <span style={{ color: 'magenta' }}>Requested</span>;
		case EchelonEventNumber.DENIED:
			return <span style={{ color: 'red' }}>Denied</span>;
	}
	return null;
}

// function getEventDebrief(ged: DebriefItem[]) {
// 	if (ged.length === 0) {
// 		return <span style={{ color: 'red' }}>No</span>;
// 	} else {
// 		return <span style={{ color: 'green' }}>Yes</span>;
// 	}
// }

function getComplete(gc: boolean): JSX.Element {
	if (gc === true) {
		return <span style={{ color: 'green' }}>Y</span>;
	} else {
		return <span style={{ color: 'red' }}>N</span>;
	}
}

export default class EventLinkList extends Page<PageProps, EventLinkListState> {
	public state: EventLinkListState = {
		state: 'LOADING',
		newStatus: EventStatus.DRAFT,
		statusSetError: Maybe.none(),
	};

	public constructor(props: PageProps) {
		super(props);
		this.setStatus = this.setStatus.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/eventlinklist',
				text: 'Event list',
			},
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Event list');

		if (this.props.member) {
			const eventListEither = await fetchApi.events.events
				.getList({}, {})
				.map(events => events.sort((a, b) => b.startDateTime - a.startDateTime));

			if (Either.isLeft(eventListEither)) {
				this.setState({
					state: 'ERROR',
					message: eventListEither.value.message,
					newStatus: EventStatus.DRAFT,
					statusSetError: Maybe.none(),
				});
			} else {
				// eventList = eventList.sort((a, b) => a.name.localeCompare(b.name));
				let events = eventListEither.value.sort(
					(a, b) => b.startDateTime - a.startDateTime,
				);

				events = events.filter(
					event => event.startDateTime > +DateTime.utc() - 13 * 60 * 60 * 24 * 30 * 1000,
				);

				const eventsThatAreLinked = events.filter(event => event.type === EventType.LINKED);

				this.setState({
					state: 'LOADED',
					events,
					eventsThatAreLinked,
					newStatus: EventStatus.DRAFT,
					statusSetError: Maybe.none(),
				});
			}
		}
	}

	public render(): JSX.Element {
		// need to check for sessionid here and return login error if not current
		if (!this.props.member) {
			return <div>Please sign in to view this content</div>;
		}

		const member = this.props.member;

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		const eventsAreLinked = this.state.eventsThatAreLinked.length > 0;

		return this.state.events.length === 0 ? (
			<div>No events to list</div>
		) : (
			<div className="eventlinklist">
				<h3>
					Click on the event number to view details. Click on the event name to edit
					event. Click on the Event Status link to change the event status from this page.
				</h3>
				<Dialogue
					open={Maybe.isSome(this.state.statusSetError)}
					displayButtons={DialogueButtons.OK}
					title="Error"
					onClose={() => this.setState({ statusSetError: Maybe.none() })}
				>
					{Maybe.orSome('')(this.state.statusSetError)}
				</Dialogue>
				<table>
					<tbody>
						<tr>
							<th>
								{this.props.account.id} Event ID :: Name
								{eventsAreLinked ? ' - [Source Event]' : null}
							</th>
							<th>Start Date</th>
							<th>Event Status</th>
							<th>Entry Complete</th>
							{this.props.account.type === AccountType.CAPSQUADRON ? (
								<th>GP Evt No.</th>
							) : null}
							<th>Debrief Present</th>
						</tr>
						{this.state.events.map(event => (
							<>
								<tr key={event.id}>
									<td>
										<Link to={`/eventviewer/${event.id}`}>{event.id}</Link> ::
										{'  '}
										{effectiveManageEventPermissionForEvent(member)(event) ===
										Permissions.ManageEvent.FULL ? (
											<Link to={`/eventform/${event.id}`}>{event.name}</Link>
										) : (
											<>{event.name}</>
										)}
										{` `}
										{event.type === EventType.LINKED ? (
											<>
												{` - [`}
												<a
													// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
													href={`https://${event.targetAccountID}.${process.env.REACT_APP_HOST_NAME}/eventviewer/${event.targetEventID}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													{event.targetAccountID}-{event.targetEventID}
												</a>
												{`]`}
											</>
										) : null}
									</td>
									<td
										style={{
											whiteSpace: 'nowrap',
										}}
									>
										{DateTime.fromMillis(event.startDateTime).toLocaleString({
											...DateTime.DATETIME_SHORT,
											hour12: false,
										})}
									</td>
									{/* <td>{getEventStatus(event.status)}</td> */}
									{/* return <span style={{ color: 'orange' }}>Tentative</span>; */}
									{/* <span style={{ color: {getStatusColor(event.status)} }}> */}
									<td>
										{effectiveManageEventPermissionForEvent(member)(event) ===
										Permissions.ManageEvent.FULL ? (
											<DialogueButtonForm<{
												eventToSet: number;
												newStatus: EventStatus;
											}>
												key={event.id}
												buttonText={getEventStatus(event.status)}
												buttonType="none"
												buttonClass="underline-button"
												displayButtons={DialogueButtons.OK_CANCEL}
												onOk={this.setStatus}
												title="Set status"
												labels={['Set status', 'Cancel']}
												values={{
													eventToSet: event.id,
													newStatus: event.status,
												}}
											>
												<Label>New event status</Label>
												<EnumRadioButton
													index={event.id}
													name="newStatus"
													labels={labels.EventStatusLabels}
													values={[
														EventStatus.DRAFT,
														EventStatus.TENTATIVE,
														EventStatus.CONFIRMED,
														EventStatus.COMPLETE,
														EventStatus.CANCELLED,
														EventStatus.INFORMATIONONLY,
													]}
													defaultValue={EventStatus.INFORMATIONONLY}
												/>
											</DialogueButtonForm>
										) : (
											<>{getEventStatusColored(event.status)}</>
										)}
									</td>
									<td>{getComplete(event.complete)}</td>
									{this.props.account.type === AccountType.CAPSQUADRON ? (
										<td>{getEventNumber(event.groupEventNumber)}</td>
									) : null}
									<td>
										{event.debrief.length > 0
											? getComplete(true)
											: getComplete(false)}
									</td>
								</tr>
							</>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	private setStatus = async ({
		eventToSet,
		newStatus,
	}: {
		eventToSet: number;
		newStatus: EventStatus;
	}): Promise<void> => {
		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.events.events.set(
			{ id: eventToSet.toString() },
			{ status: newStatus },
		);

		if (Either.isRight(result)) {
			this.setState(prev =>
				prev.state === 'LOADED'
					? {
							...prev,
							events: prev.events.map(event =>
								event.id === result.value.id ? result.value : event,
							),
					  }
					: prev,
			);
		} else {
			this.setState({
				statusSetError: Maybe.some(result.value.message),
			});
		}
	};
}
