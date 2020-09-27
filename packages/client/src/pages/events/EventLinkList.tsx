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
	EchelonEventNumber,
	Either,
	EventStatus,
	RadioReturnWithOther,
	RawResolvedEventObject,
	EventType,
	DebriefItem,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
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
}

interface EventLinkListErrorState {
	state: 'ERROR';

	message: string;
}

type EventLinkListState =
	| EventLinkListErrorState
	| EventLinkListLoadedState
	| EventLinkListLoadingState;

function getEventStatus(status: EventStatus) {
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

function getEventNumber(gen: RadioReturnWithOther<EchelonEventNumber>) {
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

function getEventDebrief(ged: DebriefItem[]) {
	if (ged.length === 0) {
		return <span style={{ color: 'red' }}>No</span>;
	} else {
		return <span style={{ color: 'green' }}>Yes</span>;
	}
}

export default class EventLinkList extends Page<PageProps, EventLinkListState> {
	public state: EventLinkListState = {
		state: 'LOADING',
	};

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
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
				.getList({}, {}, this.props.member.sessionID)
				.map(events => events.sort((a, b) => b.startDateTime - a.startDateTime));

			if (Either.isLeft(eventListEither)) {
				this.setState({
					state: 'ERROR',
					message: eventListEither.value.message,
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
				});
			}
		}
	}

	public render() {
		// need to check for sessionid here and return login error if not current
		if (!this.props.member) {
			return <div>Please sign in to view this content</div>;
		}

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
					Click on the event number to view details.  Click on the event name to edit event.
				</h3>
				<table>
					<tbody>
						<tr>
							<th>
								Event ID :: Name
								{eventsAreLinked ? ' - [Source Event]' : null}
							</th>
							<th>Start Date</th>
							<th>Status</th>
							<th>
								GP Evt No.
							</th>
							<th>Debrief</th>
						</tr>
						{this.state.events.map((event, i) => (
							<tr key={i}>
								<td>
									{event.accountID}-
									<Link to={`/eventviewer/${event.id}`}>
									{event.id}</Link> ::{'  '}
									<Link to={`/eventform/${event.id}`}>{event.name}</Link>
									{` `}
									{event.type === EventType.LINKED ? (
										<>
											{` - [`}
											<a
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
								<td>{getEventStatus(event.status)}</td>
								<td>{getEventNumber(event.groupEventNumber)}</td>
								<td>{getEventDebrief(event.debrief)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}
