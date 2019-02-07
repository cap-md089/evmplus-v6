import * as React from 'react';
import EventForm, { emptyEvent } from 'src/components/forms/usable-forms/EventForm';
import Event from 'src/lib/Event';
import Page, { PageProps } from '../Page';
import Team from 'src/lib/Team';
import { CAPMemberClasses } from 'src/lib/Members';

interface AddEventState {
	event: NewEventObject;
	createError: null | number;
	memberList: Promise<CAPMemberClasses[]>;
	teamList: Promise<Team[]>;
}

export default class AddEvent extends Page<PageProps, AddEventState> {
	public state: AddEventState = {
		createError: null,
		event: emptyEvent(),
		memberList: this.props.account.getMembers(this.props.member),
		teamList: this.props.account.getTeams(this.props.member)
	};

	constructor(props: PageProps) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public componentDidMount() {
		this.props.updateSideNav([
			{
				target: 'main-information',
				text: 'Main information',
				type: 'Reference'
			},
			{
				target: 'activity-information',
				text: 'Activity Information',
				type: 'Reference'
			},
			{
				target: 'logistics-information',
				text: 'Logistics Information',
				type: 'Reference'
			},
			{
				target: 'point-of-contact',
				text: 'Point of Contact',
				type: 'Reference'
			},
			{
				target: 'extra-information',
				text: 'Extra Information',
				type: 'Reference'
			},
			{
				target: 'team-information',
				text: 'Team Information',
				type: 'Reference'
			}
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/calendar',
				text: 'Calendar'
			},
			{
				target: '/eventform',
				text: 'Create event'
			}
		]);
		this.updateTitle('Create event');
	}

	public render() {
		return this.props.member ? (
			<EventForm
				account={this.props.account}
				member={this.props.member}
				event={this.state.event}
				isEventUpdate={false}
				onEventChange={this.updateNewEvent}
				onEventFormSubmit={this.handleSubmit}
				registry={this.props.registry}
				teamList={this.state.teamList}
				memberList={this.state.memberList}
			/>
		) : (
			<div>Please sign in</div>
		);
	}

	private async handleSubmit(event: NewEventObject) {
		if (!this.props.member) {
			return;
		}

		let eventObject;

		try {
			eventObject = await Event.Create(
				event,
				this.props.member,
				this.props.account
			);
		} catch (e) {
			this.setState({
				createError: e.status
			});

			return;
		}

		this.props.routeProps.history.push(`/eventviewer/${eventObject.id}`);
	}

	private updateNewEvent(event: NewEventObject) {
		this.setState({
			event
		});
	}
}
