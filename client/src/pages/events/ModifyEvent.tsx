import * as React from 'react';
import EventForm from 'src/components/EventForm';
import { MemberClasses } from 'src/lib/Members';
import Team from 'src/lib/Team';
import Loader from '../../components/Loader';
import Event from '../../lib/Event';
import Page, { PageProps } from '../Page';

interface ModifyEventState {
	event: null | Event;
	valid: boolean;
	memberList: Promise<MemberClasses[]>;
	teamList: Promise<Team[]>;
}

export default class ModifyEvent extends Page<
	PageProps<{ id: string }>,
	ModifyEventState
> {
	public state: ModifyEventState = {
		event: null,
		valid: false,
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
			const [event] = await Promise.all([
				Event.Get(
					parseInt(this.props.routeProps.match.params.id, 10),
					this.props.member,
					this.props.account
				)
			]);

			if (!event.isPOC(this.props.member)) {
				// TODO: Show error message
				return;
			}

			this.setState({
				event
			});

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

			this.updateTitle(`Modify event "${event.name}"`);
		}
	}

	public render() {
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.state.event) {
			return <Loader />;
		}

		return (
			<EventForm
				account={this.props.account}
				// Create a copy so that the form doesn't modify the reference
				event={this.state.event.toRaw()}
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

	private updateNewEvent(event: NewEventObject) {
		this.state.event!.set(event);

		this.setState({
			event: this.state.event
		});
	}

	private handleSubmit(event: NewEventObject) {
		if (!this.props.member) {
			return;
		}

		this.state.event!.set(event);

		this.state.event!.save(this.props.member).then(() => {
			this.props.routeProps.history.push(
				`/eventviewer/${this.state.event!.id}`
			);
		});
	}
}
