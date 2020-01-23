import * as React from 'react';
import Page, { PageProps } from '../Page';
import { NewEventObject } from 'common-lib';
import { CAPMemberClasses } from '../../lib/Members';
import Team from '../../lib/Team';
import EventForm, { emptyEvent } from '../../components/forms/usable-forms/EventForm';
import Event from '../../lib/Event';

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
				target: 'points-of-contact',
				text: 'Points of Contact',
				type: 'Reference'
			},
			{
				target: 'custom-attendance-fields',
				text: 'Custom Attendance Fields',
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
		return this.props.member && Event.HasBasicPermission(this.props.member) ? (
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
		if (!this.props.member || !Event.HasBasicPermission(this.props.member)) {
			return;
		}

		let eventObject;

		try {
			eventObject = await Event.Create(event, this.props.member, this.props.account);
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
