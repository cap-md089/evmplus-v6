import { EchelonEventNumber, EventStatus } from 'common-lib/index';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Event from '../lib/Event';
import './EventLinkList.css';
import Page, { PageProps } from './Page';
import { RadioReturn } from 'common-lib';

interface EventLinkListState {
	eventList: Event[] | null;
	eventsThatAreLinked: Event[] | null;
}

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
	return null;
}

function getEventNumber(gen: RadioReturn<EchelonEventNumber>) {
	switch (gen[0]) {
		case EchelonEventNumber.APPLIED_FOR:
			return <span style={{ color: 'blue' }}>N/R</span>;
	}
	return null;
}

export default class EventLinkList extends Page<
	PageProps,
	EventLinkListState
> {
	public state: EventLinkListState = {
		eventList: null,
		eventsThatAreLinked: null
	};

	public async componentDidMount() {
		if (this.props.member) {
			let eventList = await this.props.account.getEvents(
				this.props.member
			);

			// eventList = eventList.sort((a, b) => a.name.localeCompare(b.name));
			eventList = eventList.sort(
				(a, b) => a.startDateTime - b.startDateTime
			);

			eventList = eventList.filter(
				event =>
					event.startDateTime >
					+DateTime.utc() - (13 * 60 * 60 * 24 * 30 * 1000)
			);

			const eventsThatAreLinked = eventList.filter(
				event => !!event.sourceEvent
			);

			this.setState({ eventList, eventsThatAreLinked });
		}

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/eventlinklist',
				text: 'Event list'
			}
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Event list');
	}

	public render() {
		// need to check for sessionid here and return login error if not current
		if (!this.props.member) {
			return <div>Please sign in to view this content</div>;
		}

		if (
			this.state.eventList === null ||
			this.state.eventsThatAreLinked === null
		) {
			return <Loader />;
		}

		const eventsAreLinked = this.state.eventsThatAreLinked.length > 0;

		return this.state.eventList.length === 0 ? (
			<div>No events to list</div>
		) : (
			<div className="eventlinklist">
				<h3>
					Click '<span style={{ color: 'magenta' }}>Confirmed</span>'
					Status to set Status to '
					<span style={{ color: 'green' }}>Complete</span>'
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
								<span style={{ color: 'green' }}>GP</span> Evt No.
							</th>
							<th>
								<span style={{ color: 'gray' }}>WG</span> Evt No.
							</th>
							<th>
								<span style={{ color: 'red' }}>RG</span> Evt No.
							</th>
							<th>Wing Cal</th>
							<th>Debrief</th>
						</tr>
						{this.state.eventList.map((event, i) => (
							<tr key={i}>
								<td>
									{event.accountID}-{event.id} ::{'  '}
									<Link to={`/eventviewer/${event.id}`}>
										{event.name}
									</Link>
									{` `}
									{event.sourceEvent ? (
										<>
											{` - [`}
											<a
												href={`https://${
													event.sourceEvent.accountID
												}.capunit.com/eventviewer/${
													event.sourceEvent.id
												}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												{event.sourceEvent.accountID}-
												{event.sourceEvent.id}
											</a>
											{`]`}
										</>
									) : null}
								</td>
								<td
									style={{
										whiteSpace: 'nowrap'
									}}
								>
									{DateTime.fromMillis(
										event.startDateTime
									).toLocaleString({
										...DateTime.DATETIME_SHORT,
										hour12: false
									})}
								</td>
								<td>{getEventStatus(event.status)}</td>
								<td>{getEventNumber(event.groupEventNumber)}</td>
								<td>{getEventNumber(event.wingEventNumber)}</td>
								<td>{getEventNumber(event.regionEventNumber)}</td>
								<td>{event.publishToWingCalendar}</td>
								<td>{event.debrief}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}
