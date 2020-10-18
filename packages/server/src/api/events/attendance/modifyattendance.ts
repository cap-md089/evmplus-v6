/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema } from '@mysql/xdevapi';
import {
	ServerAPIEndpoint,
	ServerAPIRequestParameter,
	ServerEither,
	validator,
} from 'auto-client-api';
import {
	AccountObject,
	api,
	APIEndpointBody,
	asyncRight,
	destroy,
	errorGenerator,
	hasBasicAttendanceManagementPermission,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	NewAttendanceRecord,
	RawResolvedEventObject,
	RawTeamObject,
	SessionType,
	Validator,
} from 'common-lib';
import {
	ensureResolvedEvent,
	getEvent,
	getTeam,
	isMemberPartOfAccount,
	modifyEventAttendanceRecord,
	PAM,
	resolveReference,
} from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

export const getMember = (
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>,
) => (body: APIEndpointBody<api.events.attendance.ModifyAttendance>) => (
	event: RawResolvedEventObject,
) => (team: MaybeObj<RawTeamObject>) =>
	hasBasicAttendanceManagementPermission(req.member)(event)(team)
		? Maybe.orSome<ServerEither<Member>>(
				asyncRight(req.member, errorGenerator('Could not get member information')),
		  )(
				Maybe.map(resolveReference(req.mysqlx)(req.account))(
					Maybe.fromValue(body.memberID),
				),
		  ).filter(isAttendanceRecordInScope(req.mysqlx)(req.account), {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to modify this attendance record',
		  })
		: asyncRight(req.member, errorGenerator('Could not get member information'));

export const attendanceModifyValidator = Validator.Partial(
	(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules,
);

export const maybeGetTeam = (
	event: RawResolvedEventObject,
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>,
) =>
	event.teamID === null || event.teamID === undefined
		? asyncRight(Maybe.none(), errorGenerator('Could not get team membership information'))
		: getTeam(req.mysqlx)(req.account)(event.teamID).map(Maybe.some);

export const isAttendanceRecordInScope = (schema: Schema) => (account: AccountObject) => (
	attendanceRecordOwner: MemberReference,
) =>
	resolveReference(schema)(account)(attendanceRecordOwner)
		.map(isMemberPartOfAccount({})(schema))
		.flatMap(f => f(account));

export const func: ServerAPIEndpoint<api.events.attendance.ModifyAttendance> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(request =>
	validateRequest(attendanceModifyValidator)(request).flatMap(req =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.flatMap(ensureResolvedEvent(req.mysqlx))
			.flatMap(event =>
				maybeGetTeam(event, req).flatMap(maybeTeam =>
					getMember(req)(req.body)(event)(maybeTeam).flatMap(member =>
						modifyEventAttendanceRecord(req.mysqlx)(req.account)(event)(member)(
							req.body,
						),
					),
				),
			)
			.map(destroy)
			.map(wrapper),
	),
);

export default func;
