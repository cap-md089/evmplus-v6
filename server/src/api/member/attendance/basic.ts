import { Schema } from '@mysql/xdevapi';
import {
	api,
	asyncLeft,
	asyncRight,
	fromValue,
	just,
	MemberReference,
	none,
	NoSQLDocument,
	parseStringMemberReference
} from 'common-lib';
import {
	Account,
	areMemberReferencesTheSame,
	asyncEitherHandler2,
	CAPMemberClasses,
	collectResults,
	Event,
	findAndBind,
	MemberRequest,
	RawAttendanceDBRecord,
	resolveReference,
	resolveReferenceE,
	serverErrorGenerator
} from '../../../lib/internals';

export const getAttendanceRecordsForMember = async (
	member: CAPMemberClasses,
	reference: MemberReference,
	account: Account,
	schema: Schema
): Promise<api.member.attendance.EventAttendanceRecord[]> => {
	const attendanceCollection = schema.getCollection<
		RawAttendanceDBRecord & Required<NoSQLDocument>
	>('Attendance');

	const records = await collectResults(
		findAndBind(attendanceCollection, {
			memberID: reference
		})
	);

	let targetMember: CAPMemberClasses | null = null;

	return Promise.all(
		records.map(async record => {
			const [recordMember, event] = await Promise.all([
				areMemberReferencesTheSame(member, record.memberID)
					? member
					: targetMember || resolveReference(reference, account, schema, true),
				Event.Get(record.eventID, account, schema)
			]);

			targetMember = recordMember;

			return {
				member: {
					reference: record.memberID,
					name: recordMember.getFullName()
				},
				event: just({
					id: record.eventID,
					startDateTime: event.startDateTime,
					endDateTime: event.endDateTime,
					location: event.location,
					name: event.name,
					attendanceComments: record.comments
				})
			};
		})
	);
};

export default asyncEitherHandler2<api.member.attendance.Get>(
	(req: MemberRequest<{ reference?: string }>) => {
		const memberReference = fromValue(req.params.reference)
			.flatMap(parseStringMemberReference)
			.orElse(req.member.getReference())
			.some();

		const targetMember = req.member.matchesReference(memberReference)
			? asyncRight(req.member, serverErrorGenerator('Cannot get member records'))
			: resolveReferenceE(memberReference, req.account, req.mysqlx);

		return targetMember
			.flatMap(member =>
				req.member.hasPermission('AttendanceView') || req.member.flight === member.flight
					? asyncRight(member, serverErrorGenerator('Could not get member records'))
					: asyncLeft<api.ServerError, CAPMemberClasses>({
							code: 403,
							error: none<Error>(),
							message:
								'Cannot get member information for a member who is not in the same flight'
					  })
			)
			.map(member =>
				getAttendanceRecordsForMember(member, memberReference, req.account, req.mysqlx)
			);
	}
);
