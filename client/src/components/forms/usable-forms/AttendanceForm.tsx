import {
	AttendanceRecord,
	AttendanceStatus,
	MemberReference,
	NewAttendanceRecord
} from 'common-lib';
import * as React from 'react';
import Account from '../../../lib/Account';
import Event from '../../../lib/Event';
import MemberBase from '../../../lib/Members';
import { attendanceStatusLabels } from '../../../pages/events/EventViewer';
import Button from '../../Button';
import SimpleForm, {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Label,
	SimpleRadioButton,
	TextBox
} from '../SimpleForm';

const clamp = (min: number, max: number, input: number) => Math.max(min, Math.min(max, input));

interface AttendanceFormProps {
	account: Account;
	member: MemberBase;
	event: Event;
	record?: AttendanceRecord;
	updateRecord: (record: NewAttendanceRecord, member: MemberReference) => void;
	removeRecord: (record: AttendanceRecord) => void;
	updated: boolean;
	clearUpdated: () => void;
}

interface AttendanceFormState {
	attendance: NewAttendanceRecord;
	usePartTime: boolean;
}

export default class AttendanceForm extends React.Component<
	AttendanceFormProps,
	AttendanceFormState
> {
	public state: AttendanceFormState;

	public constructor(props: AttendanceFormProps) {
		super(props);

		if (props.record) {
			this.state = {
				attendance: {
					arrivalTime: props.record.arrivalTime,
					canUsePhotos: props.record.canUsePhotos,
					comments: props.record.comments,
					departureTime: props.record.departureTime,
					planToUseCAPTransportation: props.record.planToUseCAPTransportation,
					status: props.record.status
				},
				usePartTime: false
			};
		} else {
			this.state = {
				attendance: {
					arrivalTime: null,
					canUsePhotos: true,
					comments: '',
					departureTime: null,
					planToUseCAPTransportation: false,
					status: 0
				},
				usePartTime: false
			};
		}

		this.onAttendanceFormChange = this.onAttendanceFormChange.bind(this);
		this.onAttendanceFormSubmit = this.onAttendanceFormSubmit.bind(this);
		this.removeAttendanceRecord = this.removeAttendanceRecord.bind(this);
	}

	public render() {
		// Can use part time
		const cupt = this.props.event.signUpPartTime;

		// Use part time
		const upt = cupt && this.state.usePartTime;

		const eventLength = this.props.event.pickupDateTime - this.props.event.meetDateTime;

		const arrival = this.state.attendance.arrivalTime || this.props.event.meetDateTime;
		const departure = this.state.attendance.departureTime || this.props.event.pickupDateTime;

		const beforeArrival =
			clamp(this.props.event.meetDateTime, this.props.event.pickupDateTime, arrival) -
			this.props.event.meetDateTime;
		const afterDeparture =
			this.props.event.pickupDateTime -
			clamp(this.props.event.meetDateTime, this.props.event.pickupDateTime, departure);

		const timeDuring = eventLength - (beforeArrival + afterDeparture);

		const percentBeforeArrival = arrival > departure ? 1 : beforeArrival / eventLength;
		const percentAfterDeparture = arrival > departure ? 0 : afterDeparture / eventLength;
		const percentDuring = 1 - (percentBeforeArrival + percentAfterDeparture);

		return (
			<SimpleForm<NewAttendanceRecord & { usePartTime: boolean }>
				id="attendanceSingupForm"
				values={{
					...this.state.attendance,
					usePartTime: this.state.usePartTime
				}}
				onChange={this.onAttendanceFormChange}
				onSubmit={this.onAttendanceFormSubmit}
				submitInfo={{
					text: !!this.props.record ? 'Update information' : 'Sign up'
				}}
			>
				{this.props.updated ? (
					<TextBox name="null">Attendance information updated</TextBox>
				) : null}

				<Label>Comments</Label>
				<BigTextBox name="comments" />
				{this.props.event.transportationProvided ? (
					<Label>Are you using CAP transportation?</Label>
				) : null}

				{this.props.event.transportationProvided ? (
					<Checkbox key="2" name="planToUseCAPTransportation" />
				) : null}

				{cupt ? <Label>Sign up part time?</Label> : null}
				{cupt ? <Checkbox name="usePartTime" /> : null}

				{upt ? (
					<TextBox name="null">
						<div className="partTimeSignupDisplay">
							<div
								className="timeBefore"
								style={{
									width: `${percentBeforeArrival * 100}%`
								}}
							/>
							<div
								className="timeDuring"
								style={{
									width: `${percentDuring * 100}%`
								}}
							/>
							<div
								className="timeAfter"
								style={{
									width: `${percentAfterDeparture * 100}%`
								}}
							/>
							Duration:{' '}
							{timeDuring >= 3600 * 1000
								? `${Math.round(timeDuring / (3600 * 1000))} hrs `
								: null}
							{`${Math.round((timeDuring % (3600 * 1000)) / (1000 * 60))} mins`}
						</div>
					</TextBox>
				) : null}
				{upt ? <Label>Arrival time</Label> : null}
				{upt ? (
					<DateTimeInput
						name="arrivalTime"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				) : null}

				{upt ? <Label>Departure time</Label> : null}
				{upt ? (
					<DateTimeInput
						name="departureTime"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				) : null}

				<Label>Can your photo be used on social media to promote Civil Air Patrol?</Label>
				<Checkbox name="canUsePhotos" />

				{!!this.props.record ? <Label>Attendance status</Label> : null}
				{!!this.props.record ? (
					<SimpleRadioButton<AttendanceStatus>
						name="status"
						labels={attendanceStatusLabels}
					/>
				) : null}

				{!!this.props.record && this.props.member.isPOCOf(this.props.event) ? (
					<TextBox name="null">
						<Button onClick={this.removeAttendanceRecord}>
							Remove attendance record
						</Button>
					</TextBox>
				) : null}
			</SimpleForm>
		);
	}

	private onAttendanceFormChange(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.arrivalTime || this.props.event.meetDateTime;
		let departureTime = attendanceSignup.departureTime || this.props.event.pickupDateTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];
		}

		this.setState({
			attendance: {
				arrivalTime,
				comments: attendanceSignup.comments,
				departureTime,
				planToUseCAPTransportation: attendanceSignup.planToUseCAPTransportation,
				status: this.props.record
					? attendanceSignup.status
					: AttendanceStatus.COMMITTEDATTENDED,
				canUsePhotos: attendanceSignup.canUsePhotos
			},
			usePartTime: attendanceSignup.usePartTime
		});

		this.props.clearUpdated();
	}

	private async onAttendanceFormSubmit(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.arrivalTime || this.props.event.meetDateTime;
		let departureTime = attendanceSignup.departureTime || this.props.event.pickupDateTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];
		}

		const newRecord: NewAttendanceRecord = {
			arrivalTime: attendanceSignup.usePartTime
				? clamp(this.props.event.meetDateTime, this.props.event.pickupDateTime, arrivalTime)
				: null,
			comments: attendanceSignup.comments,
			departureTime: attendanceSignup.usePartTime
				? clamp(
						this.props.event.meetDateTime,
						this.props.event.pickupDateTime,
						departureTime
				  )
				: null,
			planToUseCAPTransportation: this.props.event.transportationProvided
				? attendanceSignup.planToUseCAPTransportation
				: false,
			status: this.props.record
				? attendanceSignup.status
				: AttendanceStatus.COMMITTEDATTENDED,
			canUsePhotos: attendanceSignup.canUsePhotos
		};

		if (this.props.record) {
			await this.props.event.modifyAttendee(
				this.props.member,
				this.props.record.memberID,
				newRecord
			);
		} else {
			await this.props.event.addAttendee(
				this.props.member,
				this.props.member.getReference(),
				newRecord
			);
		}

		this.props.updateRecord(newRecord, this.props.member.getReference());
	}

	private async removeAttendanceRecord() {
		if (!this.props.record) {
			return;
		}

		await this.props.event.removeAttendee(this.props.member, this.props.record.memberID);

		this.props.removeRecord(this.props.record);
	}
}
