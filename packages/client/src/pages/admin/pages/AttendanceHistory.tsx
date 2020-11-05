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
	api,
	areMembersTheSame,
	Either,
	get,
	hasOneDutyPosition,
	hasPermission,
	isCAPMember,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	pipe,
	stringifyMemberReference,
	Permissions,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import Button from '../../../components/Button';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import SimpleForm, { DateTimeInput, Label } from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import SigninLink from '../../../components/SigninLink';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import attendanceStyles from './AttendanceLog.module.css';

interface FilterState {
	filterStart: number;
	filterEnd: number;
}

interface AttendanceHistoryLoading {
	type: 'LOADING';
}

interface AttendanceHistoryError {
	type: 'ERROR';

	message: string;
}

interface AttendanceHistoryGroupLoaded {
	type: 'GROUPLOADED';

	attendanceRecords: api.member.attendance.EventAttendanceRecord[];
}

interface AttendanceHistoryMemberLoaded {
	type: 'MEMBERLOADED';

	attendanceRecords: api.member.attendance.EventAttendanceRecord[];
	memberBeingViewed: MaybeObj<MemberReference>;
}

interface AttendanceHistoryMemberListLoading {
	state: 'LOADING';
}

interface AttendanceHistoryMemberListLoaded {
	state: 'LOADED';

	members: Member[];
}

interface AttendanceHistoryMemberListError {
	state: 'ERROR';

	memberMessage: string;
}

type AttendanceHistoryState = (
	| AttendanceHistoryError
	| AttendanceHistoryMemberLoaded
	| AttendanceHistoryGroupLoaded
	| AttendanceHistoryLoading
) &
	(
		| AttendanceHistoryMemberListError
		| AttendanceHistoryMemberListLoaded
		| AttendanceHistoryMemberListLoading
	) & {
		filterState: FilterState;
	};

const AttendanceView: React.FunctionComponent<{
	records: api.member.attendance.EventAttendanceRecord[];
	isMemberTheSameAsViewer: boolean;
}> = ({ records, isMemberTheSameAsViewer }) => (
	<table className={attendanceStyles.attendanceTable}>
		<tbody>
			<tr className={attendanceStyles.attendanceTableHeaderRow}>
				{!isMemberTheSameAsViewer && <th>Name (grade at time of event)</th>}
				{!isMemberTheSameAsViewer && <th>Member ID</th>}
				<th>Event ID</th>
				<th>Event Name</th>
				<th>Event date</th>
				<th>Event link</th>
			</tr>
			{records.map((record, i) => (
				<tr key={i} className={attendanceStyles.attendanceTableRow}>
					{!isMemberTheSameAsViewer && <td>{record.member.name}</td>}
					{!isMemberTheSameAsViewer && (
						<td>{stringifyMemberReference(record.member.reference)}</td>
					)}
					<td>
						{pipe(
							Maybe.map<
								api.member.attendance.EventAttendanceRecordEventInformation,
								string
							>(event => `${event.id}`),
							Maybe.orSome(''),
						)(record.event)}
					</td>
					<td>
						{pipe(
							Maybe.map<
								api.member.attendance.EventAttendanceRecordEventInformation,
								React.ReactChild
							>(event => event.name),
							Maybe.orSome<React.ReactChild>(<i>Member has not attended an event</i>),
						)(record.event)}
					</td>
					<td>
						{pipe(
							Maybe.map<
								api.member.attendance.EventAttendanceRecordEventInformation,
								React.ReactChild
							>(
								event =>
									`${DateTime.fromMillis(event.endDateTime).toFormat(
										'yyyy LLL dd',
									)}, ${format(event.endDateTime)}`,
							),
							Maybe.orSome<React.ReactChild>(<></>),
						)(record.event)}
					</td>
					<td>
						{pipe(
							Maybe.map<
								api.member.attendance.EventAttendanceRecordEventInformation,
								React.ReactChild
							>(event => (
								<Link key={`event-link-${i}`} to={`/eventviewer/${event.id}`}>
									View Event
								</Link>
							)),
							Maybe.orSome<React.ReactChild>(<></>),
						)(record.event)}
					</td>
				</tr>
			))}
		</tbody>
	</table>
);

enum GroupTarget {
	NONE,
	FLIGHT,
	ACCOUNT,
}

export default class AttendanceHistory extends Page<
	PageProps,
	AttendanceHistoryState,
	FilterState
> {
	public state: AttendanceHistoryState = {
		type: 'LOADING',
		state: 'LOADING',
		filterState: {
			filterEnd: 0,
			filterStart: 0,
		},
	};

	public constructor(props: PageProps) {
		super(props);

		this.onFilterChange = this.onFilterChange.bind(this);
		this.handleMemberSelect = this.handleMemberSelect.bind(this);
		this.loadMyAttendance = this.loadMyAttendance.bind(this);
		this.loadShortGroupAttendance = this.loadShortGroupAttendance.bind(this);
	}

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/attendance',
				text: 'View Attendance',
			},
		]);
		this.props.updateSideNav([]);
		this.updateTitle('View Attendance');

		const member = this.props.member;
		if (member) {
			this.loadAttendanceForMember(member);

			const memberListEither = await fetchApi.member.memberList({}, {});

			if (Either.isLeft(memberListEither)) {
				this.setState(prev => ({
					...prev,
					state: 'ERROR',
					memberMessage: memberListEither.value.message,
				}));
			} else {
				this.setState(prev => ({
					...prev,
					state: 'LOADED',
					members: memberListEither.value,
				}));
			}
		}
	}

	public render() {
		const { member } = this.props;
		const state = this.state;

		if (!member) {
			return (
				<div>
					<h1>You need to sign in to view attendace</h1>
					<SigninLink>Sign in now</SigninLink>
				</div>
			);
		}

		return (
			<div>
				<div>
					<div>Set date range filter</div>
					<br />
					<br />
					<SimpleForm<FilterState>
						onChange={this.onFilterChange}
						showSubmitButton={false}
						values={this.state.filterState}
					>
						<Label>Start date</Label>
						<DateTimeInput
							name="filterStart"
							time={false}
							originalTimeZoneOffset={this.props.registry.Website.Timezone}
						/>

						<Label>End date</Label>
						<DateTimeInput
							name="filterEnd"
							time={false}
							originalTimeZoneOffset={this.props.registry.Website.Timezone}
							// errorMessage="End date cannot be before start date"
						/>
					</SimpleForm>
				</div>
				<div className={attendanceStyles.controlsBox}>
					{hasPermission('AttendanceView')(Permissions.AttendanceView.OTHER)(member) &&
					this.state.state === 'LOADED' ? (
						<MemberSelectorButton
							disabled={this.state.state !== 'LOADED'}
							memberList={this.state.members}
							onMemberSelect={this.handleMemberSelect}
							buttonType="primaryButton"
							title="Select a member to view attendance"
							displayButtons={DialogueButtons.OK_CANCEL}
							useShortLoader={true}
						>
							Select a member
						</MemberSelectorButton>
					) : hasPermission('AttendanceView')(Permissions.AttendanceView.OTHER)(member) &&
					  this.state.state === 'LOADING' ? (
						<Loader />
					) : hasPermission('AttendanceView')(Permissions.AttendanceView.OTHER)(member) &&
					  this.state.state === 'ERROR' ? (
						<div>{this.state.memberMessage}</div>
					) : null}
					{this.groupTarget !== GroupTarget.NONE && state.type !== 'GROUPLOADED' ? (
						<Button
							onClick={this.loadShortGroupAttendance}
							disabled={this.state.type === 'LOADING'}
						>
							Load {this.groupTarget === GroupTarget.ACCOUNT ? 'squadron' : 'flight'}{' '}
							attendance
						</Button>
					) : null}
					{(state.type === 'MEMBERLOADED' &&
						state.memberBeingViewed.hasValue &&
						!areMembersTheSame(state.memberBeingViewed.value)(member)) ||
					state.type === 'GROUPLOADED' ? (
						<Button
							onClick={this.loadMyAttendance}
							disabled={
								this.state.type !== 'MEMBERLOADED' &&
								this.state.type !== 'GROUPLOADED'
							}
						>
							View my attendance
						</Button>
					) : null}
				</div>
				<div>
					{state.type === 'LOADING' ? (
						<Loader />
					) : state.type === 'ERROR' ? (
						<div>{state.message}</div>
					) : (
						<AttendanceView
							records={state.attendanceRecords.filter(
								rec =>
									Maybe.isSome(rec.event) &&
									rec.event.value.endDateTime <
										this.state.filterState.filterEnd &&
									rec.event.value.startDateTime >
										this.state.filterState.filterStart,
							)}
							isMemberTheSameAsViewer={
								state.type === 'MEMBERLOADED' &&
								Maybe.orSome(false)(
									Maybe.map(areMembersTheSame(member))(state.memberBeingViewed),
								)
							}
						/>
					)}
				</div>
			</div>
		);
	}

	private get groupTarget() {
		if (!this.props.member) {
			return GroupTarget.NONE;
		}

		if (hasPermission('AttendanceView')(Permissions.AttendanceView.OTHER)(this.props.member)) {
			return GroupTarget.ACCOUNT;
		}

		if (isCAPMember(this.props.member)) {
			if (
				this.props.member.flight !== null &&
				hasOneDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])(
					this.props.member,
				)
			) {
				return GroupTarget.FLIGHT;
			}
		}

		return GroupTarget.NONE;
	}

	private onFilterChange(newFilterState: FilterState) {
		this.setState({
			filterState: newFilterState,
		});
	}

	private handleMemberSelect(member: Member | null) {
		if (member) {
			this.loadAttendanceForMember(member);
		}
	}

	private loadMyAttendance() {
		if (this.props.member) {
			this.loadAttendanceForMember(this.props.member);
		}
	}

	private async loadAttendanceForMember(member: MemberReference) {
		if (!this.props.member) {
			return;
		}

		const func = areMembersTheSame(this.props.member)(member)
			? () => fetchApi.member.attendance.get({}, {})
			: () =>
					fetchApi.member.attendance.getForMember(
						{ reference: stringifyMemberReference(member) },
						{},
					);

		const dataEither = await func();

		if (Either.isLeft(dataEither)) {
			this.setState(prev => ({
				...prev,
				type: 'ERROR',
				message: dataEither.value.message,
			}));
		} else {
			const attendanceRecords = dataEither.value.filter(Either.isRight).map(get('value'));

			this.setState(prev => ({
				...prev,

				type: 'MEMBERLOADED',
				attendanceRecords,
				memberBeingViewed: Maybe.some(member),
				buttonsDisabled: false,
			}));

			this.setState({
				filterState: {
					filterEnd: attendanceRecords.reduce(
						(prev, curr) =>
							Maybe.isSome(curr.event)
								? Math.max(prev, curr.event.value.endDateTime)
								: prev,
						0,
					),
					filterStart: attendanceRecords.reduce(
						(prev, curr) =>
							Maybe.isSome(curr.event)
								? Math.min(prev, curr.event.value.startDateTime)
								: prev,
						Number.POSITIVE_INFINITY,
					),
				},
			});
		}
	}

	private async loadShortGroupAttendance() {
		if (!this.props.member || this.state.type === 'LOADING') {
			return;
		}

		const dataEither = await fetchApi.member.attendance.getForGroup({}, {});

		if (Either.isLeft(dataEither)) {
			this.setState(prev => ({
				...prev,
				type: 'ERROR',
				message: dataEither.value.message,
			}));
		} else {
			const attendanceRecords = dataEither.value
				.filter(Either.isRight)
				.map(get('value'))
				.filter(Maybe.isSome)
				.map(get('value'));

			this.setState(prev => ({
				...prev,
				type: 'GROUPLOADED',
				attendanceRecords,
				buttonsDisabled: false,
			}));

			this.setState({
				filterState: {
					filterEnd: attendanceRecords.reduce(
						(prev, curr) =>
							Maybe.isSome(curr.event)
								? Math.max(prev, curr.event.value.endDateTime)
								: prev,
						0,
					),
					filterStart: attendanceRecords.reduce(
						(prev, curr) =>
							Maybe.isSome(curr.event)
								? Math.min(prev, curr.event.value.startDateTime)
								: prev,
						Number.POSITIVE_INFINITY,
					),
				},
			});
		}
	}
}
