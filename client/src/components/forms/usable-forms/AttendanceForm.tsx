import {
	AccountObject,
	AttendanceRecord,
	AttendanceStatus,
	effectiveManageEventPermissionForEvent,
	Either,
	NewAttendanceRecord,
	Permissions,
	RawEventObject,
	toReference,
	User
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../../lib/apis';
import { attendanceStatusLabels } from '../../../pages/events/EventViewer';
import Button from '../../Button';
import SimpleForm, {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Label,
	SimpleRadioButton,
	TextBox,
	FormBlock
} from '../SimpleForm';

const clamp = (min: number, max: number, input: number) => Math.max(min, Math.min(max, input));

export interface AttendanceFormProps {
	account: AccountObject;
	member: User;
	event: RawEventObject;
	record?: AttendanceRecord;
	updateRecord: (record: Required<NewAttendanceRecord>) => void;
	removeRecord: (record: AttendanceRecord) => void;
	updated: boolean;
	signup: boolean;
	clearUpdated: () => void;
	index?: number;
}

interface AttendanceFormState {
	attendance: NewAttendanceRecord;
	usePartTime: boolean;
	saving: boolean;
	errorSaving: boolean;
	deleting: boolean;
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
					comments: props.record.comments,
					shiftTime: props.record.shiftTime,
					planToUseCAPTransportation: props.record.planToUseCAPTransportation,
					status: props.record.status,
					customAttendanceFieldValues: []
				},
				errorSaving: false,
				usePartTime: false,
				saving: false,
				deleting: false
			};
		} else {
			this.state = {
				attendance: {
					comments: '',
					shiftTime: null,
					planToUseCAPTransportation: false,
					status: AttendanceStatus.COMMITTEDATTENDED,
					customAttendanceFieldValues: []
				},
				errorSaving: false,
				usePartTime: false,
				saving: false,
				deleting: false
			};
		}

		this.onAttendanceFormChange = this.onAttendanceFormChange.bind(this);
		this.onAttendanceFormSubmit = this.onAttendanceFormSubmit.bind(this);
		this.removeAttendanceRecord = this.removeAttendanceRecord.bind(this);
	}

	public render() {
		const canUsePartTime = this.props.event.signUpPartTime;

		const usePartTime = canUsePartTime && this.state.usePartTime;

		const eventLength = this.props.event.pickupDateTime - this.props.event.meetDateTime;

		const arrival =
			this.state.attendance.shiftTime?.arrivalTime ?? this.props.event.meetDateTime;
		const departure =
			this.state.attendance.shiftTime?.departureTime ?? this.props.event.pickupDateTime;

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
					usePartTime: this.state.usePartTime,
					// Index here is not necessarily the same as the enum values
					// If there is no record (a new one is being made), the index is for
					// 'Will attend' vs 'Will NOT attend'
					status: !!this.props.record
						? this.state.attendance.status
						: this.state.attendance.status === AttendanceStatus.COMMITTEDATTENDED
						? AttendanceStatus.COMMITTEDATTENDED
						: AttendanceStatus.NOSHOW
				}}
				onChange={this.onAttendanceFormChange}
				onSubmit={this.onAttendanceFormSubmit}
				submitInfo={{
					text: this.state.saving
						? !!this.props.record
							? 'Updating...'
							: 'Signing up...'
						: !!this.props.record
						? 'Update information'
						: 'Sign up',
					disabled: this.state.saving || this.state.deleting
				}}
			>
				{this.props.updated ? <TextBox>Attendance information updated</TextBox> : null}

				<Label>Comments</Label>
				<BigTextBox name="comments" />
				{this.props.event.transportationProvided ? (
					<Label>Are you using CAP transportation?</Label>
				) : null}

				{this.props.event.transportationProvided ? (
					<Checkbox key="2" name="planToUseCAPTransportation" />
				) : null}

				{canUsePartTime ? <Label>Sign up part time?</Label> : null}
				{canUsePartTime ? <Checkbox name="usePartTime" /> : null}

				{usePartTime ? (
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

				{usePartTime ? (
					<FormBlock name="shiftTime">
						<Label>Arrival time</Label>
						<DateTimeInput
							name="arrivalTime"
							time={true}
							originalTimeZoneOffset={'America/New_York'}
						/>

						<Label>Departure time</Label>
						<DateTimeInput
							name="departureTime"
							time={true}
							originalTimeZoneOffset={'America/New_York'}
						/>
					</FormBlock>
				) : null}

				<Label>Attendance status</Label>
				{!!this.props.record ? (
					<SimpleRadioButton<AttendanceStatus>
						name="status"
						index={this.props.index}
						labels={attendanceStatusLabels}
					/>
				) : (
					<SimpleRadioButton<AttendanceStatus>
						name="status"
						index={this.props.index}
						labels={['I will attend', 'I will NOT attend']}
					/>
				)}

				{!!this.props.record &&
				effectiveManageEventPermissionForEvent(this.props.member)(this.props.event) ===
					Permissions.ManageEvent.FULL ? (
					<TextBox name="null">
						<Button
							onClick={this.removeAttendanceRecord}
							disabled={this.state.deleting || this.state.saving}
						>
							{this.state.deleting
								? 'Deleting record...'
								: 'Remove attendance record'}
						</Button>
					</TextBox>
				) : null}
			</SimpleForm>
		);
	}

	private onAttendanceFormChange(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.shiftTime?.arrivalTime || this.props.event.meetDateTime;
		let departureTime =
			attendanceSignup.shiftTime?.departureTime || this.props.event.pickupDateTime;

		let shiftTime = attendanceSignup.shiftTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];

			shiftTime = {
				arrivalTime,
				departureTime
			};
		}

		this.setState({
			attendance: {
				comments: attendanceSignup.comments,
				shiftTime,
				planToUseCAPTransportation: attendanceSignup.planToUseCAPTransportation,
				status: !!this.props.record
					? attendanceSignup.status
					: attendanceSignup.status === AttendanceStatus.COMMITTEDATTENDED
					? AttendanceStatus.COMMITTEDATTENDED
					: AttendanceStatus.NOSHOW,
				customAttendanceFieldValues: []
			},
			usePartTime: attendanceSignup.usePartTime,
			errorSaving: false
		});

		this.props.clearUpdated();
	}

	private async onAttendanceFormSubmit(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean }
	) {
		let arrivalTime = attendanceSignup.shiftTime?.arrivalTime || this.props.event.meetDateTime;
		let departureTime =
			attendanceSignup.shiftTime?.departureTime || this.props.event.pickupDateTime;

		let shiftTime = attendanceSignup.shiftTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];

			shiftTime = {
				arrivalTime,
				departureTime
			};
		}

		shiftTime = shiftTime
			? {
					arrivalTime: clamp(
						this.props.event.meetDateTime,
						this.props.event.pickupDateTime,
						shiftTime.arrivalTime
					),
					departureTime: clamp(
						this.props.event.meetDateTime,
						this.props.event.pickupDateTime,
						shiftTime.departureTime
					)
			  }
			: null;

		const newRecord: NewAttendanceRecord = {
			comments: attendanceSignup.comments,
			shiftTime,
			planToUseCAPTransportation: this.props.event.transportationProvided
				? attendanceSignup.planToUseCAPTransportation
				: false,
			status: this.props.record
				? attendanceSignup.status
				: attendanceSignup.status === AttendanceStatus.COMMITTEDATTENDED
				? AttendanceStatus.COMMITTEDATTENDED
				: AttendanceStatus.NOSHOW,
			customAttendanceFieldValues: []
		};

		this.setState({
			saving: true
		});

		if (this.props.record) {
			const result = await fetchApi.events.attendance.modify(
				{ id: this.props.event.id.toString() },
				{ ...newRecord, memberID: this.props.record.memberID },
				this.props.member.sessionID
			);

			this.setState({
				errorSaving: Either.isLeft(result),
				saving: false
			});
		} else {
			const result = await fetchApi.events.attendance.add(
				{ id: this.props.event.id.toString() },
				{ ...newRecord, memberID: toReference(this.props.member) },
				this.props.member.sessionID
			);

			this.setState({
				errorSaving: Either.isLeft(result),
				saving: false
			});
		}

		this.props.updateRecord({
			...newRecord,
			shiftTime: this.props.record?.shiftTime ?? null,
			memberID: this.props.record?.memberID ?? toReference(this.props.member)
		});
	}

	private async removeAttendanceRecord() {
		if (!this.props.record) {
			return;
		}

		this.setState({
			deleting: true
		});

		await fetchApi.events.attendance.delete(
			{ id: this.props.event.id.toString() },
			{ member: toReference(this.props.record.memberID) },
			this.props.member.sessionID
		);

		this.setState({
			deleting: false
		});

		this.props.removeRecord(this.props.record);
	}
}
