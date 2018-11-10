import * as React from 'react';
import Loader from '../components/Loader';
import Event from '../lib/Event';
import { PageProps } from './Page';

interface LinkListState {
	eventList: Event[] | null;
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
				event => event.startDateTime < ((Date.now() / 1000) + (60*60*24*30))
			);

			this.setState({ eventList });
		}
	}

	public render() {
		return this.state.eventList === null ? (
			<Loader />
		) : this.state.eventList.length === 0 ? (
			<div>No events to list</div>
		) : (
			<table>
				<tr><th>Name:</th><th>id:</th></tr>
				{this.state.eventList.map((event, i) => (
					<tr key={i}>{event.name}</tr>
					))}
			</table>
		);
	}
}
