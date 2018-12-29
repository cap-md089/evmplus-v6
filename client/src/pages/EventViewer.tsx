import * as React from 'react';
import { Link } from 'react-router-dom';
import SimpleForm, {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Label,
	TextBox
} from 'src/components/SimpleForm';
import { parseMultCheckboxReturn } from '../components/form-inputs/MultCheckbox';
import Loader from '../components/Loader';
import { AttendanceStatus, EventStatus, PointOfContactType } from '../enums';
import Event from '../lib/Event';
import './EventViewer.css';
import { Activities, RequiredForms, Uniforms } from './ModifyEvent';
import Page, { PageProps } from './Page';

const clamp = (min: number, max: number, input: number) =>
	Math.max(min, Math.min(max, input));

interface EventViewerState {
	event: Event | null;
	error?: string;
	attendanceSignup: NewAttendanceRecord;
	usePartTime: boolean;
}

type EventViewerProps = PageProps<{ id: string }>;

const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

const formatDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(
		month + 1
	)}/${zeroPad(day)}/${year}`;
};

const eventStatus = (stat: EventStatus): string =>
	stat === EventStatus.COMPLETE
		? 'Complete'
		: stat === EventStatus.CANCELLED
		? 'Cancelled'
		: stat === EventStatus.CONFIRMED
		? 'Confirmed'
		: stat === EventStatus.DRAFT
		? 'Draft'
		: stat === EventStatus.INFORMATIONONLY
		? 'Information Only'
		: stat === EventStatus.TENTATIVE
		? 'Tentative'
		: '';

// const attendanceStatusLabels = [
// 	'Commited/Attended',
// 	'No show',
// 	'Rescinded commitment to attend'
// ];

export default class EventViewer extends Page<
	EventViewerProps,
	EventViewerState
> {
	public state: EventViewerState = {
		event: null,
		error: '',
		attendanceSignup: {
			arrivalTime: null,
			comments: '',
			departureTime: null,
			planToUseCAPTransportation: false,
			requirements: '',
			status: AttendanceStatus.COMMITTEDATTENDED,
			canUsePhotos: true
		},
		usePartTime: false
	};

	constructor(props: EventViewerProps) {
		super(props);

		this.onAttendanceFormChange = this.onAttendanceFormChange.bind(this);
		this.onAttendanceFormSubmit = this.onAttendanceFormSubmit.bind(this);
	}

	public async componentDidMount() {
		const event = await Event.Get(
			parseInt(this.props.routeProps.match.params.id.split('-')[0], 10),
			this.props.member,
			this.props.account
		);

		const eventURL = `/eventviewer/${
			event.id
		}-${event.name.toLocaleLowerCase().replace(/ /g, '-')}`;

		if (this.props.routeProps.location.pathname !== eventURL) {
			this.props.routeProps.history.replace(eventURL);
		}

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
				target: eventURL,
				text: `View ${event.name}`
			}
		]);
		this.setState(prev => ({
			event,
			attendanceSignup: {
				...prev.attendanceSignup,
				arrivalTime: event.meetDateTime,
				departureTime: event.pickupDateTime
			}
		}));
	}

	public render() {
		if (this.state.event === null) {
			return <Loader />;
		}

		// Can use part time
		const cupt = this.state.event.signUpPartTime;

		// Use part time
		const upt = cupt && this.state.usePartTime;

		const eventLength =
			this.state.event.pickupDateTime - this.state.event.meetDateTime;

		const arrival =
			this.state.attendanceSignup.arrivalTime ||
			this.state.event.meetDateTime;
		const departure =
			this.state.attendanceSignup.departureTime ||
			this.state.event.pickupDateTime;

		const beforeArrival =
			clamp(
				this.state.event.meetDateTime,
				this.state.event.pickupDateTime,
				arrival
			) - this.state.event.meetDateTime;
		const afterDeparture =
			this.state.event.pickupDateTime -
			clamp(
				this.state.event.meetDateTime,
				this.state.event.pickupDateTime,
				departure
			);

		const timeDuring = eventLength - (beforeArrival + afterDeparture);

		const percentBeforeArrival =
			arrival > departure ? 1 : beforeArrival / eventLength;
		const percentAfterDeparture =
			arrival > departure ? 0 : afterDeparture / eventLength;
		const percentDuring =
			1 - (percentBeforeArrival + percentAfterDeparture);

		return (
			<div>
				{this.props.member &&
				this.props.member.isPOCOf(this.state.event) ? (
					<>
						<Link to={`/eventform/${this.state.event.id}`}>
							Edit event "{this.state.event.name}"
						</Link>
						<br />
						<br />
					</>
				) : null}
				<div>
					<strong>Event: </strong> {this.state.event.name}
					<br />
					<strong>Event ID: </strong>{' '}
					{this.state.event.accountID.toUpperCase()}-
					{this.state.event.id}
					<br />
					<strong>Meet</strong> at{' '}
					{formatDate(this.state.event.meetDateTime)} at{' '}
					{this.state.event.location}
					<br />
					<strong>Start</strong> at{' '}
					{formatDate(this.state.event.startDateTime)} at{' '}
					{this.state.event.location}
					<br />
					<strong>End</strong> at{' '}
					{formatDate(this.state.event.endDateTime)}
					<br />
					<strong>Pickup</strong> at{' '}
					{formatDate(this.state.event.pickupDateTime)} at{' '}
					{this.state.event.pickupLocation}
					<br />
					<br />
					<strong>Transportation provided:</strong>{' '}
					{this.state.event.transportationProvided ? 'YES' : 'NO'}
					<br />
					{this.state.event.transportationProvided ? (
						<>
							<strong>Transportation Description:</strong>{' '}
							{this.state.event.transportationDescription}
							<br />
						</>
					) : null}
					<strong>Uniform:</strong>{' '}
					{parseMultCheckboxReturn(
						this.state.event.uniform,
						Uniforms,
						false
					)}
					<br />
					<strong>Comments:</strong> {this.state.event.comments}
					<br />
					<strong>Activity:</strong>{' '}
					{parseMultCheckboxReturn(
						this.state.event.activity,
						Activities,
						true
					)}
					<br />
					<strong>Required forms:</strong>{' '}
					{parseMultCheckboxReturn(
						this.state.event.requiredForms,
						RequiredForms,
						true
					)}
					<br />
					<strong>Event status:</strong>{' '}
					{eventStatus(this.state.event.status)}
					<br />
					<br />
					<div>
						{this.state.event.pointsOfContact.map((poc, i) =>
							poc.type === PointOfContactType.INTERNAL ? (
								<div key={i}>
									<b>CAP Point of Contact: </b>
									{poc.name}
									<br />
									{poc.email !== '' ? (
										<>
											<b>CAP Point of Contact Email: </b>
											{poc.email}
											<br />
										</>
									) : null}
									{poc.phone !== '' ? (
										<>
											<b>CAP Point of Contact Phone: </b>
											{poc.phone}
											<br />
										</>
									) : null}
									<br />
								</div>
							) : (
								<div key={i}>
									<b>External Point of Contact: </b>
									{poc.name}
									<br />
									{poc.email !== '' ? (
										<>
											<b>
												External Point of Contact Email:{' '}
											</b>
											{poc.email}
											<br />
										</>
									) : null}
									{poc.phone !== '' ? (
										<>
											<b>
												External Point of Contact Phone:{' '}
											</b>
											{poc.phone}
											<br />
										</>
									) : null}
									<br />
								</div>
							)
						)}
					</div>
				</div>
				{this.props.member !== null ? (
					<div>
						<h2>Attendance</h2>
						{this.state.event.attendance.filter(val =>
							this.props.member!.matchesReference(val.memberID)
						).length === 0 ? (
							upt ? (
								<SimpleForm
									id="attendanceSingupForm"
									values={{
										...this.state.attendanceSignup,
										usePartTime: this.state.usePartTime
									}}
									onChange={this.onAttendanceFormChange}
									onSubmit={this.onAttendanceFormSubmit}
									submitInfo={{
										text: 'Sign up'
									}}
								>
									<Label>Comments</Label>
									<BigTextBox name="comments" />

									<Label>
										Are you using CAP transportation?
									</Label>
									<Checkbox name="planToUseCAPTransportation" />

									<Label>Sign up part time?</Label>
									<Checkbox name="usePartTime" />

									<TextBox name="null">
										<div className="partTimeSignupDisplay">
											<div
												className="timeBefore"
												style={{
													width: `${percentBeforeArrival *
														100}%`
												}}
											/>
											<div
												className="timeDuring"
												style={{
													width: `${percentDuring *
														100}%`
												}}
											/>
											<div
												className="timeAfter"
												style={{
													width: `${percentAfterDeparture *
														100}%`
												}}
											/>
											Duration:{' '}
											{timeDuring >= 3600 * 1000
												? `${Math.round(
														timeDuring /
															(3600 * 1000)
												  )} hrs `
												: null}
											{`${Math.round(
												(timeDuring % (3600 * 1000)) /
													(1000 * 60)
											)} mins`}
										</div>
									</TextBox>

									<Label>Arrival time</Label>
									<DateTimeInput
										name="arrivalTime"
										date={true}
										time={true}
										originalTimeZoneOffset={
											'America/New_York'
										}
									/>

									<Label>Departure time</Label>
									<DateTimeInput
										name="departureTime"
										date={true}
										time={true}
										originalTimeZoneOffset={
											'America/New_York'
										}
									/>

									<Label>
										Can your photo be used on social media
										to promote Civil Air Patrol?
									</Label>
									<Checkbox name="canUsePhotos" />
								</SimpleForm>
							) : cupt ? (
								<SimpleForm
									id="attendanceSingupForm"
									values={{
										...this.state.attendanceSignup,
										usePartTime: this.state.usePartTime
									}}
									onChange={this.onAttendanceFormChange}
									onSubmit={this.onAttendanceFormSubmit}
									submitInfo={{
										text: 'Sign up'
									}}
								>
									<Label>Comments</Label>
									<BigTextBox name="comments" />

									<Label>
										Are you using CAP transportation?
									</Label>
									<Checkbox name="planToUseCAPTransportation" />

									<Label>Sign up part time?</Label>
									<Checkbox name="usePartTime" />

									<Label>
										Can your photo be used on social media
										to promote Civil Air Patrol?
									</Label>
									<Checkbox name="canUsePhotos" />
								</SimpleForm>
							) : (
								<SimpleForm
									id="attendanceSingupForm"
									values={{
										...this.state.attendanceSignup,
										usePartTime: this.state.usePartTime
									}}
									onChange={this.onAttendanceFormChange}
									onSubmit={this.onAttendanceFormSubmit}
									submitInfo={{
										text: 'Sign up'
									}}
								>
									<Label>Comments</Label>
									<BigTextBox name="comments" />

									<Label>
										Are you using CAP transportation?
									</Label>
									<Checkbox name="planToUseCAPTransportation" />

									<Label>
										Can your photo be used on social media
										to promote Civil Air Patrol?
									</Label>
									<Checkbox name="canUsePhotos" />
								</SimpleForm>
							)
						) : null}
						{this.state.event.attendance.map((val, i) => (
							<div key={i}>{val.memberName}</div>
						))}
					</div>
				) : null}
			</div>
		);
	}

	private onAttendanceFormChange(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.arrivalTime || this.state.event!.meetDateTime;
		let departureTime = attendanceSignup.departureTime || this.state.event!.pickupDateTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];
		}

		this.setState({
			attendanceSignup: {
				arrivalTime,
				comments: attendanceSignup.comments,
				departureTime,
				planToUseCAPTransportation:
					attendanceSignup.planToUseCAPTransportation,
				requirements: attendanceSignup.requirements || '',
				status: AttendanceStatus.COMMITTEDATTENDED,
				canUsePhotos: attendanceSignup.canUsePhotos
			},
			usePartTime: attendanceSignup.usePartTime
		});
	}

	private onAttendanceFormSubmit(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.arrivalTime || this.state.event!.meetDateTime;
		let departureTime = attendanceSignup.departureTime || this.state.event!.pickupDateTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];
		}

		this.state
			.event!.addAttendee(
				this.props.member!,
				this.props.member!.getReference(),
				{
					arrivalTime: attendanceSignup.usePartTime
						? clamp(
								this.state.event!.meetDateTime,
								this.state.event!.pickupDateTime,
								arrivalTime
						  )
						: null,
					comments: attendanceSignup.comments,
					departureTime: attendanceSignup.usePartTime
						? clamp(
								this.state.event!.meetDateTime,
								this.state.event!.pickupDateTime,
								departureTime
						  )
						: null,
					planToUseCAPTransportation:
						attendanceSignup.planToUseCAPTransportation,
					requirements: attendanceSignup.requirements,
					status: AttendanceStatus.COMMITTEDATTENDED,
					canUsePhotos: attendanceSignup.canUsePhotos
				}
			)
			.then(() => {
				this.forceUpdate();
			});
	}
}
