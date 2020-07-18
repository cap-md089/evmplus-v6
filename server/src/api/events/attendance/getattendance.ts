import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterHandler,
	canManageEvent,
	errorGenerator,
	Permissions,
	SessionType,
} from 'common-lib';
import { getAttendanceForEvent, getEvent, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.attendance.GetAttendance> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.filter(
			event =>
				!event.privateAttendance ||
				canManageEvent(Permissions.ManageEvent.FULL)(req.member)(event),
			{
				type: 'OTHER',
				code: 403,
				message: 'Member cannot view private attendance',
			}
		)
		.flatMap(getAttendanceForEvent(req.mysqlx))
		.map(asyncIterHandler(errorGenerator('Could not get attendance records for event')))
);

export default func;
