import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	always,
	api,
	asyncIterMap,
	Either,
	errorGenerator,
	Maybe,
	RawEventObject,
	ServerError,
	SessionType,
	stringifyMemberReference,
	toReference,
	ValidatorError,
} from 'common-lib';
import { getAttendanceForMember, getEvent, PAM, RawAttendanceDBRecord } from 'server-common';

const stripEvent = (record: RawAttendanceDBRecord) => (
	event: RawEventObject
): api.member.attendance.EventAttendanceRecordEventInformation => ({
	attendanceComments: record.comments,
	endDateTime: event.endDateTime,
	id: event.id,
	location: event.location,
	name: event.name,
	startDateTime: event.startDateTime,
});

export const expandRecord = (getEventFunc: typeof getEvent) => (
	req: ServerAPIRequestParameter<api.member.attendance.Get>
) => (record: RawAttendanceDBRecord) =>
	getEventFunc(req.mysqlx)(req.account)(record.eventID)
		.map(stripEvent(record))
		.map(Maybe.some)
		.leftFlatMap(always(Either.right(Maybe.none())))
		.map<api.member.attendance.EventAttendanceRecord>(event => ({
			event,
			member: {
				name: record.memberName,
				reference: record.memberID,
			},
		}))
		.leftMap(
			err => ({
				...(err as Exclude<ServerError, ValidatorError>),
				message: `Record could not be shown for ${
					record.memberName
				} (${stringifyMemberReference(record.memberID)})`,
			}),
			errorGenerator(
				`Record could not be shown for ${record.memberName} (${stringifyMemberReference(
					record.memberID
				)})`
			)
		);

export const func: ServerAPIEndpoint<api.member.attendance.Get> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getAttendanceForMember(req.mysqlx)(req.account)(toReference(req.member)).map(
		asyncIterMap(expandRecord(getEvent)(req))
	)
);

export default func;
