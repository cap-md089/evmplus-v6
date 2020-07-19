import * as React from 'react';
import Page, { PageProps } from '../Page';
import {
	Member,
	FullTeamObject,
	AsyncEither,
	Either,
	effectiveManageEventPermission,
	Permissions,
	MaybeObj,
	Maybe
} from 'common-lib';
import EventForm, {
	emptyEventFormValues,
	NewEventFormValues,
	convertFormValuesToEvent
} from '../../components/forms/usable-forms/EventForm';
import fetchApi from '../../lib/apis';
import SigninLink from '../../components/SigninLink';
import Loader from '../../components/Loader';

interface AddEventUIState {
	saving: boolean;
}

interface AddEventLoadingState {
	state: 'LOADING';
}

interface AddEventErrorState {
	state: 'ERROR';

	message: string;
}

interface AddEventLoadedState {
	state: 'LOADED';

	event: NewEventFormValues;
	memberList: Member[];
	teamList: FullTeamObject[];
}

type AddEventState = (AddEventLoadingState | AddEventErrorState | AddEventLoadedState) &
	AddEventUIState;

export default class AddEvent extends Page<PageProps, AddEventState> {
	public state: AddEventState = {
		state: 'LOADING',
		saving: false
	};

	constructor(props: PageProps) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		if (effectiveManageEventPermission(this.props.member) === Permissions.ManageEvent.NONE) {
			return;
		}

		const infoEither = await AsyncEither.All([
			fetchApi.member.memberList({}, {}, this.props.member.sessionID),
			fetchApi.team.list({}, {}, this.props.member.sessionID)
		]);

		if (Either.isLeft(infoEither)) {
			return this.setState({
				state: 'ERROR',
				message: 'Could not load member or team information',
				saving: false
			});
		}

		const [memberList, teamList] = infoEither.value;

		this.setState(prev => ({
			...prev,

			state: 'LOADED',
			event: emptyEventFormValues(),
			memberList,
			teamList
		}));

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
		if (!this.props.member) {
			return <SigninLink>Please sign in.</SigninLink>;
		}

		if (effectiveManageEventPermission(this.props.member) === Permissions.ManageEvent.NONE) {
			return <div>You do not have permission to do that.</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		return (
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
		);
	}

	private async handleSubmit(maybeEvent: MaybeObj<NewEventFormValues>) {
		if (!this.props.member) {
			return;
		}

		const maybeFullEvent = Maybe.flatMap(convertFormValuesToEvent)(maybeEvent);

		this.setState({
			saving: true
		});

		if (!maybeFullEvent.hasValue) {
			return;
		}

		const createResult = await fetchApi.events.events.add(
			{},
			maybeFullEvent.value,
			this.props.member.sessionID
		);

		if (Either.isLeft(createResult)) {
			this.setState({
				saving: false,
				state: 'ERROR',
				message: 'Could not create event'
			});
		} else {
			this.props.routeProps.history.push(`/eventviewer/${createResult.value.id}`);
		}
	}

	private updateNewEvent(event: NewEventFormValues) {
		if (this.state.state !== 'LOADED') {
			return;
		}

		this.setState(prev => ({
			...prev,
			event
		}));
	}
}
