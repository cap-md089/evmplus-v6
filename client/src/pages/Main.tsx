import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Uniforms } from 'src/components/EventForm';
import { parseMultCheckboxReturn } from 'src/components/form-inputs/MultCheckbox';
import Loader from 'src/components/Loader';
import { SideNavigationItem } from 'src/components/SideNavigation';
import Event from 'src/lib/Event';
import Page, { PageProps } from './Page';
import { EventStatus } from '../../../lib';

const margin10 = {
	margin: '10px auto',
	width: 180
};

const block = {
	display: 'block',
	margin: '10px auto'
};

const center: React.CSSProperties = {
	textAlign: 'center'
};

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

		const [pages, events, nextEvent] = await Promise.all([
			this.props.account.getBlogPages(),
			this.props.account.getUpcomingEvents(),
			this.props.account.getNextRecurringEvent()
		]);

		this.setState({
			events,
			nextEvent
		});

		for (const page of pages) {
			if (page.parentID === null) {
				links.push({
					target: '/page/view/' + page.id,
					text: page.title,
					type: 'Link'
				});
			}
		}

		this.props.updateSideNav(links);
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
									{parseMultCheckboxReturn(
										this.state.nextEvent.uniform,
										Uniforms,
										false
									)}
									<br />
									<Link to={this.state.nextEvent.getEventURL()}>
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
											</strong>
											{' '}
											<Link to={ev.getEventURL()}>{ev.name}</Link>
											{' '}
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
											</strong>
											{' '}
											<Link to={ev.getEventURL()}>{ev.name}</Link>
										</span>
									)}
								</div>
							))}
						</section>
					</>
				)}
				<div className="divider" />
				<section className="halfSection" style={{ float: 'left' }}>
					<h4>How to become a Senior Member (Age 18+)</h4>
					<div>
						<p>
							As a CAP Senior Member, you can choose to serve in one of 25 Specialty
							Track Career Fields ranging from Public Affairs, to Administration,
							Communications, IT or Cadet Programs. We need your skills, and we will
							train you in the CAP Career Field you choose.
						</p>
						<p>
							Right now we need Aircrews, Scanner, Observers, and Pilots. We can train
							you to fly exciting Search and Rescue Missions. Service to your
							Community and Country is part-time, and can be an exciting second
							career.
						</p>
					</div>
					<h4>How to become a Cadet (Age 10-21)</h4>
					<div>
						<p>The CAP Cadet Program trains tomorrow's Leaders today.</p>
						<p>
							The program is run by our Cadet Leaders, under the direction of trained
							and screened CAP Senior Members. Weekly meetings at our local Squadrons
							develop Character and Leadership.
						</p>
						<p>There is NO Obligation for Military service.</p>
						<p>
							We offer our Cadets' summer/winter Encampments, Flying, Pilot Training,
							Rocketry, travel oppurtunities, and traing and participation in Search
							and Rescue operations.
						</p>
					</div>
				</section>
				<section className="halfSection" style={{ float: 'right' }}>
					<div style={margin10}>
						<Link to="/page/aerospaceeducation">
							<img src="/images/aerospace.png" />
							<p style={center}>Aerospace Education</p>
						</Link>
					</div>
					<div style={margin10}>
						<Link to="/page/emergencyservices">
							<img src="/images/emergency.png" style={block} />
							<p style={center}>Emergency Services</p>
						</Link>
					</div>
					<div style={margin10}>
						<Link to="/page/cadetprograms">
							<img src="/images/programs.png" style={block} />
							<p style={center}>Cadet Programs</p>
						</Link>
					</div>
				</section>
			</div>
		);
	}
}
