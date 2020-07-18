import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	asyncIterMap,
	errorGenerator,
	parseStringMemberReference,
	SessionType,
} from 'common-lib';
import { getAttendanceForMember, getEvent, PAM } from 'server-common';
import { expandRecord } from './basic';

export const func: ServerAPIEndpoint<api.member.attendance.GetForMember> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('AttendanceView')(req =>
		asyncEither(
			parseStringMemberReference(req.params.reference),
			errorGenerator('Could not parse member ID')
		)
			.flatMap(getAttendanceForMember(req.mysqlx)(req.account))
			.map(asyncIterMap(expandRecord(getEvent)(req)))
	)
);

export default func;
