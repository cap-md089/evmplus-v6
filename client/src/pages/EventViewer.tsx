import * as React from 'react';
import { parseMultCheckboxReturn } from "../components/form-inputs/MultCheckbox";
import Loader from '../components/Loader';
import myFetch from '../lib/myFetch';
import { Uniforms, Activities, RequiredForms } from "./ModifyEvent";
import { PageProps } from './Page';
import { EventStatus } from '../enums';

interface EventViewerState {
	event: EventObject | null;
	error?: string;
}

type EventViewerProps = PageProps<{ id: string }>;

const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

const formatDate = (date: number) => {
	const dateObject = new Date(date * 1000);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

const eventStatus = (stat: EventStatus): string =>
	stat === EventStatus.COMPLETE ?
		'Complete' :
	stat === EventStatus.CANCELLED ?
		'Cancelled' :
	stat === EventStatus.CONFIRMED ?
		'Confirmed' :
	stat === EventStatus.DRAFT ?
		'Draft' : 
	stat === EventStatus.INFORMATIONONLY ?
		'Information Only' :
	stat === EventStatus.TENTATIVE ?
		'Tentative' :
		''


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
			.then((event: EventObject) => {
				this.props.updateBreadCrumbs([
					{
						text: 'Home',
						target: '/'
					},
					{
						target: '/calendar',
						text: 'Calendar'
					},
					{
						target: '/eventviewer/' + event.id,
						text: `View ${event.name}`
					}
				])
				this.setState({ event })
			});
	}

	public render() {
		if (this.state.event === null) {
			return <Loader />;
		}

		return (
			<div>
				<div>
					<strong>Event: </strong> {this.state.event.name}<br />
					<strong>Event ID: </strong> {this.state.event.accountID.toUpperCase()}-{this.state.event.id}<br />
					<strong>Meet</strong> at {formatDate(this.state.event.meetDateTime)} at {this.state.event.location}<br />
					<strong>Start</strong> at {formatDate(this.state.event.startDateTime)} at {this.state.event.location}<br />
					<strong>End</strong> at {formatDate(this.state.event.endDateTime)}<br />
					<strong>Pickup</strong> at {formatDate(this.state.event.pickupDateTime)} at {this.state.event.pickupLocation}<br />
					<br />
					<strong>Transportation provided:</strong> {this.state.event.transportationProvided ? 'YES' : 'NO'}<br />
					{this.state.event.transportationProvided ? <><strong>Transportation Description:</strong> {this.state.event.transportationDescription}</> : null}
					<strong>Uniform:</strong> {parseMultCheckboxReturn(this.state.event.uniform, Uniforms, false)}<br />
					<strong>Comments:</strong> {this.state.event.comments}<br />
					<strong>Activity:</strong> {parseMultCheckboxReturn(this.state.event.activity, Activities, true)}<br />
					<strong>Required forms:</strong> {parseMultCheckboxReturn(this.state.event.requiredForms, RequiredForms, true)}<br />
					<strong>Event status:</strong> {eventStatus(this.state.event.status[0])}<br />
					<br />
					<div>
						{this.state.event.pointsOfContact.map((poc, i) => (
							<React.Fragment key={i}>
								<b>Point of Contact Email: </b>{poc.email}
							</React.Fragment>
						))}
					</div>
				</div>
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
