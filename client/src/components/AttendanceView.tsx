import React, { Component } from 'react';
import Event from '../lib/Event';
import Account from '../lib/Account';
import MemberBase from '../lib/Members';
import { AttendanceRecord, MemberReference, NewAttendanceRecord } from 'common-lib';
import { DateTime } from 'luxon';
import AttendanceForm from './forms/usable-forms/AttendanceForm';

interface AttendanceItemViewProps {
	owningEvent: Event;
	owningAccount: Account;
	member: MemberBase;
	attendanceRecord: AttendanceRecord;
	removeAttendance: (record: AttendanceRecord) => void;
	updateAttendance: (record: NewAttendanceRecord, member: MemberReference) => void;
	clearUpdated: () => void;
	updated: boolean;
}

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
		return this.props.member.hasPermission('ManageEvent') ||
			this.props.owningEvent.isPOC(this.props.member) ||
			this.props.member.matchesReference(this.props.attendanceRecord.memberID) ? (
			<AttendanceForm
				account={this.props.owningAccount}
				event={this.props.owningEvent}
				member={this.props.member}
				updateRecord={this.props.updateAttendance}
				record={this.props.attendanceRecord}
				updated={this.props.updated}
				clearUpdated={this.props.clearUpdated}
				removeRecord={this.props.removeAttendance}
			/>
		) : (
			<div>
				Comments: {this.props.attendanceRecord.comments}
				Status: <span>{this.props.attendanceRecord.status}</span>
				Plan to use CAP transportation:{' '}
				{this.props.attendanceRecord.planToUseCAPTransportation ? 'Yes' : 'No'}
				{this.props.attendanceRecord.arrivalTime !== null &&
				this.props.attendanceRecord.departureTime !== null ? (
					<>
						Arrival time:{' '}
						{DateTime.fromMillis(
							this.props.attendanceRecord.arrivalTime
						).toLocaleString()}
						Departure time:{' '}
						{DateTime.fromMillis(
							this.props.attendanceRecord.departureTime
						).toLocaleString()}
					</>
				) : null}
			</div>
		);
	}
}
