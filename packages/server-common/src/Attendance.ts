/**
 * Copyright (C) 2021 Andrew Rioux
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

import { Collection, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterEitherFilter,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
	CustomAttendanceFieldValue,
	errorGenerator,
	hasBasicAttendanceManagementPermission,
	identity,
	Maybe,
	MaybeObj,
	MemberReference,
	RawEventObject,
	User,
} from 'common-lib';
import { AccountBackend } from './Account';
import { Backends } from './backends';
import { EventsBackend, getEventID, newEnsureResolvedEvent } from './Event';
import { MemberBackend } from './Members';
import { collectResults, findAndBindC, generateResults } from './MySQLUtil';
import { ServerEither } from './servertypes';
import { TeamsBackend } from './Team';

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

// const attendanceRecordBelongsToAccount = (accountGetter: AccountGetter) => (schema: Schema) => (
// 	accountID: string,
// ) => (attendanceRecord: AttendanceRecord) =>
// 	accountGetter
// 		.byId(schema)(accountID)
// 		.flatMap(account =>
// 			resolveReference(schema)(account)(attendanceRecord.memberID).flatMap(member =>
// 				isMemberPartOfAccount(accountGetter)(schema)(member)(account),
// 			),
// 		);

const getAttendanceEventIdentifier = ({ id, accountID }: { id: number; accountID: string }) => ({
	eventID: id,
	accountID,
});

export const getAttendanceForEvent = (schema: Schema) => (event: RawEventObject) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findAndBindC<RawAttendanceDBRecord>(getAttendanceEventIdentifier(getEventID(event))))
		.map(generateResults)
		.map(attendanceRecordIterMapper);

export const attendanceRecordMapper = (rec: RawAttendanceDBRecord): AttendanceRecord => ({
	comments: rec.comments,
	customAttendanceFieldValues: rec.customAttendanceFieldValues,
	memberID: rec.memberID,
	memberName: rec.memberName,
	planToUseCAPTransportation: rec.planToUseCAPTransportation,
	status: rec.status,
	summaryEmailSent: rec.summaryEmailSent,
	timestamp: rec.timestamp,
	shiftTime: rec.shiftTime,
	sourceAccountID: rec.accountID,
	sourceEventID: rec.eventID,
});

export const attendanceRecordIterMapper = asyncIterMap(attendanceRecordMapper);

const findForMemberFunc = (now = Date.now) => ({ id: accountID }: AccountObject) => (
	member: MemberReference,
) => (collection: Collection<RawAttendanceDBRecord>) =>
	collection
		.find(
			'memberID.id = :member_id AND memberID.type = :member_type AND accountID = :accountID AND shiftTime.departureTime < :endDateTime',
		)
		// @ts-ignore
		.bind('member_id', member.id)
		// @ts-ignore
		.bind('member_type', member.type)
		.bind('accountID', accountID)
		// @ts-ignore
		.bind('endDateTime', now());

export const getLatestAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference): ServerEither<MaybeObj<RawAttendanceDBRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map(find => find.limit(1).sort('shiftTime.departureTime DESC'))
		.map(collectResults)
		.map(Maybe.fromArray);
export const getLatestAttendanceForMember = getLatestAttendanceForMemberFunc(Date.now);

export const getAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map<AsyncIter<RawAttendanceDBRecord>>(generateResults);
export const getAttendanceForMember = getAttendanceForMemberFunc(Date.now);

const attendanceFilterError = errorGenerator('Could not verify attendance permissions');
const arrayHasOneTrue = (arr: boolean[]) => arr.some(identity);

export const getAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendanceRecord: AttendanceRecord) =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(newEnsureResolvedEvent(backend))
			.flatMap(event =>
				AsyncEither.All([
					asyncRight(
						areMembersTheSame(attendanceViewer)(attendanceRecord.memberID),
						attendanceFilterError,
					),
					event.teamID === undefined || event.teamID === null
						? asyncRight(
								hasBasicAttendanceManagementPermission(attendanceViewer)(event)(
									Maybe.none(),
								),
								attendanceFilterError,
						  )
						: backend
								.getTeam(account)(event.teamID)
								.map(Maybe.some)
								.map(
									hasBasicAttendanceManagementPermission(attendanceViewer)(event),
								),
				]).map(arrayHasOneTrue),
			),
	);

export const getDetailedAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendanceRecord: AttendanceRecord) =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(newEnsureResolvedEvent(backend))
			.flatMap(event =>
				AsyncEither.All([
					asyncRight(
						areMembersTheSame(attendanceViewer)(attendanceRecord.memberID),
						attendanceFilterError,
					),
					event.teamID === undefined || event.teamID === null
						? asyncRight(
								hasBasicAttendanceManagementPermission(attendanceViewer)(event)(
									Maybe.none(),
								),
								attendanceFilterError,
						  )
						: backend
								.getTeam(account)(event.teamID)
								.map(Maybe.some)
								.map(
									hasBasicAttendanceManagementPermission(attendanceViewer)(event),
								),
				]).map(arrayHasOneTrue),
			),
	);

export const applyAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendance: AsyncIter<AttendanceRecord>) =>
	asyncIterMap<AttendanceRecord, AttendanceRecord>(record =>
		AsyncEither.All([
			backend
				.getAccount(record.sourceAccountID)
				.flatMap(account => backend.getEvent(account)(record.sourceEventID)),
			getDetailedAttendanceFilter(backend)(attendanceViewer)(record),
		])
			.map(([event, canSeeDetails]) =>
				canSeeDetails
					? record
					: ({
							comments: '',
							customAttendanceFieldValues: [],
							memberID: record.memberID,
							memberName: record.memberName,
							planToUseCAPTransportation: false,
							shiftTime: {
								arrivalTime: event.meetDateTime,
								departureTime: event.pickupDateTime,
							},
							sourceAccountID: record.sourceAccountID,
							sourceEventID: record.sourceEventID,
							status: record.status,
							summaryEmailSent: false,
							timestamp: record.timestamp,
					  } as AttendanceRecord),
			)
			.fullJoin()
			.then(identity, always(record)),
	)(asyncIterEitherFilter(getAttendanceFilter(backend)(attendanceViewer))(attendance));

export const canMemberModifyRecord = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceModifier: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	asyncRight(false, attendanceFilterError);

export const canMemberSeeCustomAttendanceField = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (customAttendanceField: CustomAttendanceFieldValue) =>
	asyncRight(false, attendanceFilterError);

export const canMemberModifyCustomAttendanceField = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceModifier: User) => (customAttendanceField: CustomAttendanceFieldValue) =>
	asyncRight(false, attendanceFilterError);

export const applyAttendanceRecordUpdates = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceModifier: User) => (attendanceRecord: AttendanceRecord) =>
	asyncRight(void 0, errorGenerator('Could not update member attendance record'));
