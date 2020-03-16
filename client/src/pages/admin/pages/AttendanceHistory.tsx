import {
	api,
	Either,
	either,
	EitherObj,
	just,
	Maybe,
	MemberReference,
	none,
	NullMemberReference,
	stringifyMemberReference,
	MaybeObj,
	maybe
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import Loader from '../../../components/Loader';
import SigninLink from '../../../components/SigninLink';
import MemberBase, { CAPNHQMember, CAPProspectiveMember } from '../../../lib/Members';
import Page, { PageProps } from '../../Page';
import attendanceStyles from './AttendanceLog.module.css';
import Button from '../../../components/Button';

interface AttendanceHistoryUIState {
	buttonsDisabled: boolean;
}

interface AttendanceHistoryLoading {
	type: 'LOADING';
}

interface AttendanceHistoryLoaded {
	type: 'LOADED';
	attendanceRecords: Either<api.HTTPError, api.member.attendance.EventAttendanceRecord[]>;
	memberBeingViewed: Maybe<MemberReference>;
}

type AttendanceHistoryState = (AttendanceHistoryLoaded | AttendanceHistoryLoading) &
	AttendanceHistoryUIState;

const AttendanceView: React.FunctionComponent<{
	records: api.member.attendance.EventAttendanceRecord[];
	isMemberTheSameAsViewer: boolean;
}> = ({ records, isMemberTheSameAsViewer }) => (
	<table className={attendanceStyles.attendanceTable}>
		<tbody>
			<tr className={attendanceStyles.attendanceTableHeaderRow}>
				{!isMemberTheSameAsViewer && <th>Name</th>}
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
						<td>
							{
								(record.member.reference as Exclude<
									MemberReference,
									NullMemberReference
								>).id
							}
						</td>
					)}
					<td>
						{maybe(record.event)
							.map(event => `${event.id}`)
							.orElse('')
							.some()}
					</td>
					<td>
						{maybe(record.event)
							.map(event => <>{event.name}</>)
							.orElse(<i>Member has not attended an event</i>)
							.some()}
					</td>
					<td>
						{maybe(record.event)
							.map(
								event =>
									`${DateTime.fromMillis(event.endDateTime).toFormat(
										'yyyy LLL dd'
									)}, ${format(event.endDateTime)}`
							)
							.orElse('')
							.some()}
					</td>
					<td>
						{maybe(record.event)
							.map(event => (
								<Link key={`event-link-${i}`} to={`/eventviewer/${event.id}`}>
									View Event
								</Link>
							))
							.orElse(<></>)
							.some()}
					</td>
				</tr>
			))}
		</tbody>
	</table>
);

enum GroupTarget {
	NONE,
	FLIGHT,
	ACCOUNT
}

export default class AttendanceHistory extends Page<PageProps, AttendanceHistoryState> {
	public state: AttendanceHistoryState = {
		type: 'LOADING',

		buttonsDisabled: false
	};

	private members = this.props.account.getMembers(this.props.member);

	public constructor(props: PageProps) {
		super(props);

		this.handleMemberSelect = this.handleMemberSelect.bind(this);
		this.loadMyAttendance = this.loadMyAttendance.bind(this);
		this.loadShortGroupAttendance = this.loadShortGroupAttendance.bind(this);
	}

	public componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/admin',
				text: 'Administration'
			},
			{
				target: '/admin/attendance',
				text: 'View Attendance'
			}
		]);
		this.props.updateSideNav([]);
		this.updateTitle('View Attendance');

		const member = this.props.member;
		if (member) {
			this.loadAttendanceForMember(member.getReference());
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
				<div className={attendanceStyles.controlsBox}>
					{member.hasPermission('AttendanceView') ? (
						<MemberSelectorButton
							disabled={this.state.buttonsDisabled}
							memberList={this.members}
							onMemberSelect={this.handleMemberSelect}
							buttonType="primaryButton"
							title="Select a member to view attendance"
							displayButtons={DialogueButtons.OK_CANCEL}
							useShortLoader={true}
						>
							Select a member
						</MemberSelectorButton>
					) : null}
					{this.groupTarget !== GroupTarget.NONE ? (
						<Button
							onClick={this.loadShortGroupAttendance}
							disabled={this.state.buttonsDisabled}
						>
							Load {this.groupTarget === GroupTarget.ACCOUNT ? 'squadron' : 'flight'}{' '}
							attendance
						</Button>
					) : null}
					{state.type === 'LOADED' &&
					state.memberBeingViewed
						.map(ref => !member.matchesReference(ref))
						.orElse(true)
						.some() ? (
						<Button
							onClick={this.loadMyAttendance}
							disabled={this.state.buttonsDisabled}
						>
							View my attendance
						</Button>
					) : null}
				</div>
				<div>
					{state.type === 'LOADING' ? (
						<Loader />
					) : (
						state.attendanceRecords.cata(
							err => <div>Error loading values: {err.message}</div>,
							records => (
								<AttendanceView
									records={records}
									isMemberTheSameAsViewer={state.memberBeingViewed
										.map(ref => member.matchesReference(ref))
										.orElse(false)
										.some()}
								/>
							)
						)
					)}
				</div>
			</div>
		);
	}

	private get groupTarget() {
		if (this.props.member?.hasPermission('AttendanceView')) {
			return GroupTarget.ACCOUNT;
		}

		if (
			this.props.member instanceof CAPNHQMember ||
			this.props.member instanceof CAPProspectiveMember
		) {
			if (
				this.props.member.flight !== null &&
				this.props.member.hasDutyPosition([
					'Cadet Flight Commander',
					'Cadet Flight Sergeant'
				])
			) {
				return GroupTarget.FLIGHT;
			}
		}

		return GroupTarget.NONE;
	}

	private handleMemberSelect(member: MemberBase | null) {
		if (member) {
			this.loadAttendanceForMember(member.getReference());
		}
	}

	private loadMyAttendance() {
		this.loadAttendanceForMember(this.props.member!.getReference());
	}

	private async loadAttendanceForMember(member: MemberReference) {
		if (!this.props.member || this.state.buttonsDisabled) {
			return;
		}

		const url = this.props.member.matchesReference(member)
			? '/api/member/attendance/'
			: `/api/member/attendance/${stringifyMemberReference(member)}`;

		this.setState({
			buttonsDisabled: true
		});

		const data = await this.props.member.memberFetch(url);

		const jsonData = (await data.json()) as EitherObj<
			api.HTTPError,
			api.member.attendance.EventAttendanceRecord[]
		>;

		this.setState({
			type: 'LOADED',
			attendanceRecords: either(jsonData),
			memberBeingViewed: just(member),
			buttonsDisabled: false
		});
	}

	private async loadShortGroupAttendance() {
		if (!this.props.member || this.state.buttonsDisabled) {
			return;
		}

		this.setState({
			buttonsDisabled: true
		});

		const data = await this.props.member.memberFetch(`/api/member/attendance/short`);

		const jsonData = (await data.json()) as EitherObj<
			api.HTTPError,
			api.member.attendance.EventAttendanceRecord[]
		>;

		this.setState({
			type: 'LOADED',
			attendanceRecords: either(jsonData),
			memberBeingViewed: none(),
			buttonsDisabled: false
		});
	}
}
