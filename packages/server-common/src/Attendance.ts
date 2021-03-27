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
	AsyncIter,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
	errorGenerator,
	identity,
	Maybe,
	MaybeObj,
	MemberReference,
	RawEventObject,
} from 'common-lib';
import { AccountGetter, getMemoizedAccountGetter } from './Account';
import { isMemberPartOfAccount, resolveReference } from './Members';
import { collectResults, findAndBindC, generateResults } from './MySQLUtil';
import { getEventID } from './Event';
import { ServerEither } from './servertypes';

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

const attendanceRecordBelongsToAccount = (accountGetter: AccountGetter) => (schema: Schema) => (
	accountID: string,
) => (attendanceRecord: AttendanceRecord) =>
	accountGetter
		.byId(schema)(accountID)
		.flatMap(account =>
			resolveReference(schema)(account)(attendanceRecord.memberID).flatMap(member =>
				isMemberPartOfAccount(accountGetter)(schema)(member)(account),
			),
		);

const getAttendanceEventIdentifier = ({ id, accountID }: { id: number; accountID: string }) => ({
	eventID: id,
	accountID,
});

export const getAttendanceForEvent = (schema: Schema) => (
	viewingAccount: MaybeObj<AccountObject>,
) => (event: RawEventObject) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findAndBindC<RawAttendanceDBRecord>(getAttendanceEventIdentifier(getEventID(event))))
		.map(generateResults)
		.map(attendanceRecordIterMapper)
		.map(
			Maybe.isSome(viewingAccount)
				? asyncIterFilter(record =>
						attendanceRecordBelongsToAccount(getMemoizedAccountGetter(schema))(schema)(
							viewingAccount.value.id,
						)(record)
							.fullJoin()
							.catch(always(false)),
				  )
				: identity,
		);

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
