import {
	ServerAPIEndpoint,
	ServerAPIRequestParameter,
	ServerEither,
	validator,
} from 'auto-client-api';
import {
	api,
	APIEndpointBody,
	asyncRight,
	canManageEvent,
	destroy,
	effectiveManageEventPermissionForEvent,
	errorGenerator,
	Maybe,
	Member,
	NewAttendanceRecord,
	Permissions,
	RawEventObject,
	SessionType,
	Validator,
} from 'common-lib';
import {
	getAccount,
	getEvent,
	modifyEventAttendanceRecord,
	PAM,
	resolveReference,
} from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';

export const getMember = (
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>
) => (body: APIEndpointBody<api.events.attendance.ModifyAttendance>) => (event: RawEventObject) =>
	canManageEvent(Permissions.ManageEvent.FULL)(req.member)(event)
		? Maybe.orSome<ServerEither<Member>>(
				asyncRight(req.member, errorGenerator('Could not get member information'))
		  )(Maybe.map(resolveReference(req.mysqlx)(req.account))(Maybe.fromValue(body.memberID)))
		: asyncRight(req.member, errorGenerator('Could not get member information'));

const attendanceModifyValidator = Validator.Partial(
	(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules
);

export const func: ServerAPIEndpoint<api.events.attendance.ModifyAttendance> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	validateRequest(attendanceModifyValidator)(request).flatMap(req =>
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
				getMember(req)(req.body)(event).flatMap(member =>
					modifyEventAttendanceRecord(req.mysqlx)(req.account)(event)(member)(req.body)
				)
			)
			.map(destroy)
	)
);

export default func;
