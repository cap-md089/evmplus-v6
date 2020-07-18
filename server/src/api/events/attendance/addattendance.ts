import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	applyCustomAttendanceFields,
	asyncRight,
	destroy,
	effectiveManageEventPermissionForEvent,
	errorGenerator,
	EventObject,
	isValidMemberReference,
	Maybe,
	NewAttendanceRecord,
	Permissions,
	SessionType,
	toReference,
} from 'common-lib';
import {
	addMemberToAttendance,
	getEvent,
	getFullEventObject,
	PAM,
	resolveReference,
} from 'server-common';

const getRecord = (req: ServerAPIRequestParameter<api.events.attendance.Add>) => (
	event: EventObject
) =>
	(isValidMemberReference(req.body.memberID) &&
	effectiveManageEventPermissionForEvent(req.member)(event) === Permissions.ManageEvent.FULL
		? resolveReference(req.mysqlx)(req.account)(req.body.memberID)
		: asyncRight(req.member, errorGenerator('Could not get member'))
	)
		.map(toReference)
		.map<Required<NewAttendanceRecord>>(memberID => ({
			...req.body,
			customAttendanceFieldValues: applyCustomAttendanceFields(event.customAttendanceFields)(
				req.body.customAttendanceFieldValues
			),
			shiftTime: req.body.shiftTime ?? null,
			memberID,
		}));

export const func: ServerAPIEndpoint<api.events.attendance.Add> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))
		.flatMap(event =>
			getRecord(req)(event).flatMap(addMemberToAttendance(req.mysqlx)(req.account)(event))
		)
		.map(destroy)
);

export default func;
