import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	always,
	api,
	asyncIterHandler,
	asyncIterMap,
	asyncRight,
	canManageEvent,
	collectGeneratorAsync,
	errorGenerator,
	Maybe,
	NewAttendanceRecord,
	Permissions,
	RawEventObject,
	SessionType,
	Validator,
} from 'common-lib';
import {
	addMemberToAttendanceFunc,
	getAttendanceForEvent,
	getEvent,
	getFullEventObject,
	PAM,
} from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';

const bulkAttendanceValidator = new Validator({
	members: Validator.ArrayOf(
		Validator.Required(
			(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules
		)
	),
});

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.attendance.AddBulk> = (
	now = Date.now
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(bulkAttendanceValidator)(request).flatMap(req =>
			getEvent(req.mysqlx)(req.account)(req.params.id)
				.filter(canManageEvent(Permissions.ManageEvent.FULL)(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member cannot perform this action',
				})
				.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))

				.flatMap<RawEventObject>(event =>
					asyncRight(
						collectGeneratorAsync(
							asyncIterMap(
								addMemberToAttendanceFunc(now)(req.mysqlx)(req.account)(event)
							)(req.body.members)
						),
						errorGenerator('Could not add attendance records')
					).map(always(event))
				)

				.flatMap(getAttendanceForEvent(req.mysqlx))
				.map(asyncIterHandler(errorGenerator('Could not get attendance record')))
		)
	);

export default func();
