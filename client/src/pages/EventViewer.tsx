import * as React from 'react';
import Loader from '../components/Loader';
import myFetch from '../lib/myFetch';
import { PageProps } from './Page';

interface EventViewerState {
	event: EventObject | null;
	error?: string;
}

type EventViewerProps = PageProps<{ id: string }>;

export default class EventViewer extends React.Component<
	EventViewerProps,
	EventViewerState
> {
	public state: EventViewerState = {
		event: null,
		error: ''
	};

	constructor(props: EventViewerProps) {
		super(props);
	}

	public componentDidMount() {
		myFetch('/api/event/' + this.props.routeProps.match.params.id, {
			headers: {
				authorization: this.props.member.sessionID
			}
		})
			.then(val => val.json())
			.then((event: EventObject) => this.setState({ event }));
	}

	public render() {
		return this.state.event === null ? (
			<Loader />
		) : (
			<div>
				<h1>{this.state.event.name}</h1>
				<div>
					<h2>Attendance</h2>
					{this.state.event.attendance.map((val, i) => (
						<div key={i}>{val.memberRankName}</div>
					))}
				</div>
			</div>
		);
	}
}
