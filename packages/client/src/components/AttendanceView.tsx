/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	areMembersTheSame,
	AttendanceRecord,
	AttendanceStatus,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldValue,
	effectiveManageEventPermissionForEvent,
	Member,
	NewAttendanceRecord,
	RawEventObject,
	RegistryValues,
	User,
} from 'common-lib';
import { DateTime } from 'luxon';
import React, { Component } from 'react';
import AttendanceForm from './forms/usable-forms/AttendanceForm';

const renderCustomAttendanceField = (attendanceFieldItem: CustomAttendanceFieldValue) =>
	attendanceFieldItem.type === CustomAttendanceFieldEntryType.CHECKBOX ? (
		<span style={{ color: attendanceFieldItem.value ? 'green' : 'red' }}>
			{attendanceFieldItem.value ? 'YES' : 'NO'}
		</span>
	) : attendanceFieldItem.type === CustomAttendanceFieldEntryType.TEXT ||
	  attendanceFieldItem.type === CustomAttendanceFieldEntryType.NUMBER ? (
		<span>{attendanceFieldItem.value}</span>
	) : attendanceFieldItem.type === CustomAttendanceFieldEntryType.DATE ? (
		<span>{new Date(attendanceFieldItem.value).toISOString()}</span>
	) : (
		<i>This field currently is not supported</i>
	);

interface AttendanceItemViewProps {
	owningEvent: RawEventObject;
	owningAccount: AccountObject;
	member: User;
	registry: RegistryValues;
	attendanceRecord: AttendanceRecord;
	removeAttendance: (record: AttendanceRecord) => void;
	updateAttendance: (record: Required<NewAttendanceRecord>, member: Member) => void;
	clearUpdated: () => void;
	recordMember?: Member | null;
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
	),
};

interface AttendanceItemViewState {
	open: boolean;
}

export default class AttendanceItemView extends Component<
	AttendanceItemViewProps,
	AttendanceItemViewState
> {
	public state: AttendanceItemViewState = {
		open: false,
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
				registry={this.props.registry}
				member={this.props.member}
				updateRecord={this.props.updateAttendance}
				record={this.props.attendanceRecord}
				updated={this.props.updated}
				clearUpdated={this.props.clearUpdated}
				removeRecord={this.props.removeAttendance}
				recordMember={this.props.recordMember}
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
							this.props.attendanceRecord.shiftTime.arrivalTime,
						).toLocaleString()}
						<br />
						Departure time:{' '}
						{DateTime.fromMillis(
							this.props.attendanceRecord.shiftTime.departureTime,
						).toLocaleString()}
					</>
				) : null}
				{this.props.attendanceRecord.customAttendanceFieldValues.map((field, index) => (
					<>
						<br />
						{field.title}: {renderCustomAttendanceField(field)}
					</>
				))}
			</div>
		);
	}
}
