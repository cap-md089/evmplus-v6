import { EventStatus, presentMultCheckboxReturn } from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Uniforms } from '../components/forms/usable-forms/EventForm';
import Loader from '../components/Loader';
import { SideNavigationItem } from '../components/page-elements/SideNavigation';
import Event from '../lib/Event';
import Page, { PageProps } from './Page';

interface MainState {
	events: Event[] | null;
	nextEvent: Event | null;
}

export default class Main extends Page<PageProps, MainState> {
	public state: MainState = {
		events: null,
		nextEvent: null
	};

	public async componentDidMount() {
		const links: SideNavigationItem[] = [
			{
				target: '/team',
				text: 'Team list',
				type: 'Link'
			}
		];

		if (this.props.member) {
			links.push({
				target: '/admin',
				text: 'Administration',
				type: 'Link'
			});
		}

		this.props.updateSideNav(links);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			}
		]);
		this.updateTitle();

		const [events, nextEvent] = await Promise.all([
			this.props.account.getUpcomingEvents(),
			this.props.account.getNextRecurringEvent()
		]);

		this.setState({
			events,
			nextEvent: nextEvent.join()
		});
	}

	public render() {
		return (
			<div>
				{this.state.events === null ? (
					<Loader />
				) : (
					<>
						<section className="halfSection" style={{ float: 'left' }}>
							{this.state.nextEvent === null ? (
								<h3 style={{ textAlign: 'center' }}>No upcoming meeting</h3>
							) : (
								<>
									<h3
										style={{
											textAlign: 'center'
										}}
									>
										Next meeting
									</h3>
									<strong>Event</strong>: {this.state.nextEvent.name}
									<br />
									<strong>Time</strong>:{' '}
									{DateTime.fromMillis(
										this.state.nextEvent.meetDateTime
									).toLocaleString({
										year: 'numeric',
										weekday: 'short',
										month: 'short',
										day: '2-digit',
										hour: '2-digit',
										minute: '2-digit',
										hour12: false
									})}
									<br />
									<strong>Location</strong>: {this.state.nextEvent.meetLocation}
									<br />
									<strong>Uniform of the day</strong>:{' '}
									{presentMultCheckboxReturn(this.state.nextEvent.uniform)
										.map(uniform => <>{uniform}</>)
										.orElse(<i>No uniform specified</i>)
										.some()}
									<br />
									<Link
										to={`/eventviewer/${this.state.nextEvent.getEventURLComponent()}`}
									>
										View details
									</Link>
								</>
							)}
						</section>
						<section className="halfSection">
							{this.state.events.length === 0 ? (
								<h3
									style={{
										textAlign: 'center',
										lineHeight: 'initial'
									}}
								>
									No upcoming events
								</h3>
							) : (
								<h3
									style={{
										textAlign: 'center',
										lineHeight: 'initial'
									}}
								>
									Upcoming events
								</h3>
							)}
							{this.state.events.map((ev, i) => (
								<div key={i}>
									{ev.status === EventStatus.CANCELLED ? (
										<span style={{ color: 'red' }}>
											<strong>
												{DateTime.fromMillis(
													ev.meetDateTime
												).toLocaleString({
													day: '2-digit',
													month: 'long'
												})}
											</strong>{' '}
											<Link to={`/eventviewer/${ev.getEventURLComponent()}`}>
												{ev.name}
											</Link>{' '}
											<strong>!! Cancelled !!</strong>
										</span>
									) : (
										<span>
											<strong>
												{DateTime.fromMillis(
													ev.meetDateTime
												).toLocaleString({
													day: '2-digit',
													month: 'long'
												})}
											</strong>{' '}
											<Link to={`/eventviewer/${ev.getEventURLComponent()}`}>
												{ev.name}
											</Link>
										</span>
									)}
								</div>
							))}
						</section>
					</>
				)}
			</div>
		);
	}
}
