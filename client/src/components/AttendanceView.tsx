import {
	AccountObject,
	areMembersTheSame,
	AttendanceRecord,
	AttendanceStatus,
	effectiveManageEventPermissionForEvent,
	NewAttendanceRecord,
	RawEventObject,
	User
} from 'common-lib';
import { DateTime } from 'luxon';
import React, { Component } from 'react';
import AttendanceForm from './forms/usable-forms/AttendanceForm';

interface AttendanceItemViewProps {
	owningEvent: RawEventObject;
	owningAccount: AccountObject;
	member: User;
	attendanceRecord: AttendanceRecord;
	removeAttendance: (record: AttendanceRecord) => void;
	updateAttendance: (record: Required<NewAttendanceRecord>) => void;
	clearUpdated: () => void;
	updated: boolean;
	index: number;
}

const statusDescription = {
	[AttendanceStatus.COMMITTEDATTENDED]: (
		<span style={{ color: 'green' }}>Committed/attended</span>
	),
	[AttendanceStatus.NOSHOW]: <span style={{ color: 'red' }}>No show</span>,
	[AttendanceStatus.RESCINDEDCOMMITMENTTOATTEND]: (
		<span style={{ color: 'yellow' }}>Rescinded commitment to attend</span>
	),
	[AttendanceStatus.NOTPLANNINGTOATTEND]: (
		<span style={{ color: 'purple' }}>Not planning to attend</span>
	)
};

interface AttendanceItemViewState {
	open: boolean;
}

export default class AttendanceItemView extends Component<
	AttendanceItemViewProps,
	AttendanceItemViewState
> {
	public state: AttendanceItemViewState = {
		open: false
	};

	public constructor(props: AttendanceItemViewProps) {
		super(props);
	}

	public render() {
		return effectiveManageEventPermissionForEvent(this.props.member)(this.props.owningEvent) ||
			areMembersTheSame(this.props.member)(this.props.attendanceRecord.memberID) ? (
			<AttendanceForm
				account={this.props.owningAccount}
				event={this.props.owningEvent}
				member={this.props.member}
				updateRecord={this.props.updateAttendance}
				record={this.props.attendanceRecord}
				updated={this.props.updated}
				clearUpdated={this.props.clearUpdated}
				removeRecord={this.props.removeAttendance}
				signup={false}
				index={this.props.index}
			/>
		) : (
			<div>
				Comments: {this.props.attendanceRecord.comments}
				<br />
				Status: {statusDescription[this.props.attendanceRecord.status]}
				<br />
				Plan to use CAP transportation:{' '}
				{this.props.attendanceRecord.planToUseCAPTransportation ? 'Yes' : 'No'}
				<br />
				{this.props.attendanceRecord.shiftTime !== null ? (
					<>
						Arrival time:{' '}
						{DateTime.fromMillis(
							this.props.attendanceRecord.shiftTime.arrivalTime
						).toLocaleString()}
						<br />
						Departure time:{' '}
						{DateTime.fromMillis(
							this.props.attendanceRecord.shiftTime.departureTime
						).toLocaleString()}
					</>
				) : null}
			</div>
		);
	}
}
