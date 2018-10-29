import * as React from 'react';
import Loader from '../components/Loader';
import myFetch from '../lib/myFetch';
import { PageProps } from './Page';

interface LinkListState {
	list: EventObject[] | null;
}

export default class LinkList extends React.Component<
	PageProps,
	LinkListState
> {
	public state: LinkListState = {
		list: null
	};

	public componentDidMount() {
		if (this.props.member) {
			myFetch('/api/event', {
				headers: {
					authorization: this.props.member.sessionID
				}
			})
				.then(val => val.json())
				.then((list: EventObject[]) => this.setState({ list }));
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
