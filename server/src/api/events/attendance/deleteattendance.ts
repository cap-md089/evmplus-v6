import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	APIEndpointBody,
	asyncRight,
	canManageEvent,
	destroy,
	effectiveManageEventPermissionForEvent,
	errorGenerator,
	Maybe,
	MemberReference,
	Permissions,
	RawEventObject,
	SessionType,
	toReference,
} from 'common-lib';
import { getAccount, getEvent, PAM, removeMemberFromEventAttendance } from 'server-common';

export const getMember = (
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>
) => (body: APIEndpointBody<api.events.attendance.Delete>) => (event: RawEventObject) =>
	canManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
		? Maybe.orSome<MemberReference>(toReference(req.member))(Maybe.fromValue(body.member))
		: toReference(req.member);

export const func: ServerAPIEndpoint<api.events.attendance.Delete> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.flatMap(event =>
			effectiveManageEventPermissionForEvent(req.member)(event) ===
				Permissions.ManageEvent.FULL || !event.sourceEvent
				? asyncRight(event, errorGenerator('Could not get event information'))
				: getAccount(req.mysqlx)(event.sourceEvent.accountID).flatMap(account =>
						getEvent(req.mysqlx)(account)(event.sourceEvent!.id)
				  )
		)
		.flatMap(event =>
			removeMemberFromEventAttendance(req.mysqlx)(req.account)(event)(
				getMember(req)(req.body)(event)
			)
		)
		.map(destroy)
);

export default func;
