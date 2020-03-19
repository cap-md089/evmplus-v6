import * as React from 'react';
import Loader from '../../components/Loader';
import Event from '../../lib/Event';
import Page, { PageProps } from '../Page';
import { CAPMemberClasses } from '../../lib/Members';
import Team from '../../lib/Team';
import EventForm, {
	NewEventFormValues,
	convertToFormValues,
	convertFormValuesToEvent
} from '../../components/forms/usable-forms/EventForm';

interface ModifyEventUIState {
	memberList: Promise<CAPMemberClasses[]>;
	teamList: Promise<Team[]>;
	errorMessage: string | null;
}

interface ModifyEventStateLoading {
	stage: 'LOADING';
}

interface ModifyEventStateLoaded {
	stage: 'LOADED';
	event: Event;
	eventFormValues: NewEventFormValues;
}

type ModifyEventState = (ModifyEventStateLoaded | ModifyEventStateLoading) & ModifyEventUIState;

export default class ModifyEvent extends Page<PageProps<{ id: string }>, ModifyEventState> {
	public state: ModifyEventState = {
		stage: 'LOADING',

		errorMessage: null,
		memberList: this.props.account.getMembers(this.props.member),
		teamList: this.props.account.getTeams(this.props.member)
	};

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public async componentDidMount() {
		if (this.props.member) {
			const event = await Event.Get(
				parseInt(this.props.routeProps.match.params.id, 10),
				this.props.member,
				this.props.account
			);

			if (!event.isPOC(this.props.member)) {
				// TODO: Show error message
				return;
			}

			this.setState(prev => ({
				...prev,

				stage: 'LOADED',
				event,
				eventFormValues: convertToFormValues(event)
			}));

			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: `/eventviewer/${event.id}`,
					text: `View event "${event.name}"`
				},
				{
					target: `/eventform/${event.id}`,
					text: `Modify event "${event.name}"`
				}
			]);

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

			this.updateTitle(`Modify event "${event.name}"`);
		}
	}

	public render() {
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (this.state.stage === 'LOADING') {
			return <Loader />;
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
			/>
		);
	}

	private updateNewEvent(eventFormValues: NewEventFormValues) {
		if (this.state.stage !== 'LOADED') {
			return;
		}

		this.setState(prev => ({
			...prev,
			eventFormValues
		}));
	}

	private handleSubmit(event: NewEventFormValues, valid: boolean) {
		if (!this.props.member) {
			return;
		}

		if (this.state.stage !== 'LOADED') {
			return;
		}

		if (!valid) {
			return;
		}

		const eventObject = this.state.event;

		eventObject.set(convertFormValuesToEvent(event));

		eventObject.save(this.props.member).then(() => {
			this.props.routeProps.history.push(`/eventviewer/${eventObject.id}`);
		});
	}
}
