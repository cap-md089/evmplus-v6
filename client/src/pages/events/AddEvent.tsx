import * as React from 'react';
import Page, { PageProps } from '../Page';
import { NewEventObject } from 'common-lib';
import { CAPMemberClasses } from '../../lib/Members';
import Team from '../../lib/Team';
import EventForm, {
	emptyEventFormValues,
	NewEventFormValues,
	convertFormValuesToEvent
} from '../../components/forms/usable-forms/EventForm';
import Event from '../../lib/Event';

interface AddEventState {
	event: NewEventFormValues;
	createError: null | number;
	memberList: Promise<CAPMemberClasses[]>;
	teamList: Promise<Team[]>;
	saving: boolean;
}

export default class AddEvent extends Page<PageProps, AddEventState> {
	public state: AddEventState = {
		createError: null,
		event: emptyEventFormValues(),
		memberList: this.props.account.getMembers(this.props.member),
		teamList: this.props.account.getTeams(this.props.member),
		saving: false
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
				saving={this.state.saving}
			/>
		) : (
			<div>Please sign in</div>
		);
	}

	private async handleSubmit(event: NewEventFormValues, valid: boolean) {
		if (!this.props.member || !Event.HasBasicPermission(this.props.member)) {
			return;
		}

		if (!valid) {
			return;
		}

		let realEvent;

		try {
			realEvent = convertFormValuesToEvent(event);
		} catch (e) {
			this.setState({
				createError: 400
			});
			return;
		}

		let eventObject;

		this.setState({
			saving: true
		});

		try {
			eventObject = await Event.Create(realEvent, this.props.member, this.props.account);
		} catch (e) {
			this.setState({
				createError: e.status,
				saving: false
			});

			return;
		}

		this.setState({
			saving: false
		});

		this.props.routeProps.history.push(`/eventviewer/${eventObject.id}`);
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.setState({
			event
		});
	}
}
