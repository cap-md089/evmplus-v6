import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncRight,
	canManageEvent,
	destroy,
	errorGenerator,
	Permissions,
	SessionType,
	toReference,
} from 'common-lib';
import { getEvent, PAM, removeMemberFromEventAttendance } from 'server-common';

const getMember = (req: ServerAPIRequestParameter<api.events.attendance.Delete>) => (
	canModifyEvent: boolean
) => (canModifyEvent ? req.body.member ?? toReference(req.member) : toReference(req.member));

export const func: ServerAPIEndpoint<api.events.attendance.Delete> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id).flatMap(event =>
		asyncRight(
			getMember(req)(canManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)),
			errorGenerator('Could not delete member from attendance')
		)
			.tap(console.log)
			.flatMap(removeMemberFromEventAttendance(req.mysqlx)(req.account)(event))
			.map(destroy)
	)
);

export default func;
