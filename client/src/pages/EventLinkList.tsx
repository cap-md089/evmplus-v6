import * as React from 'react';
import Loader from '../components/Loader';
import Event from '../lib/Event';
import { PageProps } from './Page';
import { Link } from 'react-router-dom';
import './EventLinkList.css';
import { EventStatus } from '../enums';
import { EchelonEventNumber } from '../enums';


interface LinkListState {
	eventList: Event[] | null;
}

function getEventStatus(status: RadioReturn<EventStatus>) {
	switch (status[0]) {
		case EventStatus.COMPLETE:
			return <span style={{ color: 'green' }}>Complete</span>;
		case EventStatus.CANCELLED:
			return <span style={{ color: 'red' }}>Cancelled</span>;
		case EventStatus.CONFIRMED:
			return <span style={{ color: 'blue' }}>Confirmed</span>;
		case EventStatus.DRAFT:
			return <span style={{ color: 'orange' }}>Draft</span>;
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

export default class LinkList extends React.Component<
	PageProps,
	LinkListState
> {
	public state: LinkListState = {
		eventList: null
	};

	public async componentDidMount() {
		if (this.props.member) {
			let eventList = await this.props.account.getEvents(
				this.props.member
			);

			eventList = eventList.sort((a, b) => a.name.localeCompare(b.name));

			eventList = eventList.filter(
				event =>
					event.startDateTime < Date.now() / 1000 + 60 * 60 * 24 * 30
			);

			this.setState({ eventList });
		}
	}

	public render() {
		// need to check for sessionid here and return login error if not current
		if (!this.props.member) {
			return <div>Please sign in to view this content</div>
		}

		return this.state.eventList === null ? (
			<Loader />
		) : this.state.eventList.length === 0 ? (
			<div>No events to list</div>
		) : (
			<div className="eventlinklist">
				<table>
					<tr>
						<th>Event ID :: Name, Start Date</th>
						<th>Status</th>
						<th><span style={{ color: 'green' }}>GP</span> Evt No.</th>
						<th><span style={{ color: 'gray' }}>WG</span> Evt No.</th>
						<th><span style={{ color: 'red' }}>RG</span> Evt No.</th>
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
								, {event.startDateTime}
							</td>
							<td>{getEventStatus(event.status)}</td>
							<td>{getEventNumber(event.groupEventNumber)}</td>
							<td>{getEventNumber(event.wingEventNumber)}</td>
							<td>{getEventNumber(event.regionEventNumber)}</td>
							<td>{event.publishToWingCalendar}</td>
							<td>{event.debrief}</td>
						</tr>
					))}
				</table>
			</div>
		);
	}
}
