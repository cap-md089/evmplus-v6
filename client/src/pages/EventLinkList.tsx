import * as React from 'react';
import Loader from '../components/Loader';
import Event from '../lib/Event';
import { PageProps } from './Page';

interface LinkListState {
	list: Event[] | null;
}

export default class LinkList extends React.Component<
	PageProps,
	LinkListState
> {
	public state: LinkListState = {
		list: null
	};

	public async componentDidMount() {
		if (this.props.member) {
			const list = await this.props.account.getEvents(this.props.member);

			this.setState({ list });
		}
	}

	public render() {
		return this.state.list === null ? (
			<Loader />
		) : this.state.list.length === 0 ? (
			<div>No events to list</div>
		) : (
			<div>
				{this.state.list.map((event, i) => (
					<div key={i}>Name: {event.name}</div>
				))}
			</div>
		);
	}
}
