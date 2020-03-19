import { Schema } from '@mysql/xdevapi';
import {
	api,
	fromValue,
	just,
	left,
	MemberReference,
	none,
	NoSQLDocument,
	right
} from 'common-lib';
import {
	Account,
	areMemberReferencesTheSame,
	asyncEitherHandler2,
	CAPMemberClasses,
	CAPNHQMember,
	CAPProspectiveMember,
	collectGenerator,
	collectResults,
	Event,
	findAndBind,
	MemberRequest,
	RawAttendanceDBRecord,
	resolveReference,
	UserList
} from '../../../lib/internals';

export const getAttendanceRecordForMembers = async (
	member: CAPMemberClasses,
	references: MemberReference[],
	account: Account,
	schema: Schema
): Promise<api.member.attendance.EventAttendanceRecord[]> => {
	const attendanceCollection = schema.getCollection<
		RawAttendanceDBRecord & Required<NoSQLDocument>
	>('Attendance');

	const records = await Promise.all(
		references.map(
			async reference =>
				[
					fromValue(
						(
							await collectResults(
								findAndBind(attendanceCollection, {
									memberID: reference
								})
									.sort('departureTime DESC')
									.limit(1)
							)
						)[0]
					),
					reference
				] as const
		)
	);

	return Promise.all(
		records.map(async record => {
			if (!record[0].hasValue) {
				const noRecordRecordMember = await (areMemberReferencesTheSame(member, record[1])
					? member
					: resolveReference(record[1], account, schema, true));

				return {
					member: {
						reference: record[1],
						name: noRecordRecordMember.getFullName()
					},
					event: none<api.member.attendance.EventAttendanceRecordEventInformation>()
				};
			}

			const [recordMember, event] = await Promise.all([
				areMemberReferencesTheSame(member, record[0].value.memberID)
					? member
					: resolveReference(record[0].value.memberID, account, schema, true),
				Event.Get(record[0].value.eventID, account, schema)
			]);

			return {
				member: {
					reference: record[0].value.memberID,
					name: recordMember.getFullName()
				},
				event: just<api.member.attendance.EventAttendanceRecordEventInformation>({
					id: record[0].value.eventID,
					startDateTime: event.startDateTime,
					endDateTime: event.endDateTime,
					location: event.location,
					name: event.name,
					attendanceComments: record[0].value.comments
				})
			};
		})
	);
};

enum GroupTarget {
	NONE,
	FLIGHT,
	ACCOUNT
}

const groupTarget = (member: UserList) => {
	if (member.hasPermission('AttendanceView', 1)) {
		return GroupTarget.ACCOUNT;
	}

	if (member instanceof CAPNHQMember || member instanceof CAPProspectiveMember) {
		if (
			member.flight !== null &&
			member.hasDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])
		) {
			return GroupTarget.FLIGHT;
		}
	}

	return GroupTarget.NONE;
};

export default asyncEitherHandler2<api.member.attendance.Get>(async (req: MemberRequest) => {
	const group = groupTarget(req.member);

	if (group === GroupTarget.NONE) {
		return left({
			error: none<Error>(),
			message: 'Member does not have permission to get the attendance for a flight or unit',
			code: 403
		});
	}

	const members = await collectGenerator(req.account.getMembers());
	const references =
		group === GroupTarget.FLIGHT
			? members.filter(mem => req.member.flight === mem.flight).map(mem => mem.getReference())
			: members.map(mem => mem.getReference());

	return right(
		await getAttendanceRecordForMembers(req.member, references, req.account, req.mysqlx)
	);
});
