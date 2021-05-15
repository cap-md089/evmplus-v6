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

import { ServerAPIRequestParameter } from 'auto-client-api';
import {
	always,
	api,
	applyCustomAttendanceFields,
	asyncRight,
	canSignSomeoneElseUpForEvent,
	canSignUpForEvent,
	Either,
	errorGenerator,
	EventObject,
	hasBasicAttendanceManagementPermission,
	isValidMemberReference,
	Maybe,
	MaybeObj,
	NewAttendanceRecord,
	RawTeamObject,
	ServerError,
	SessionType,
	toReference,
} from 'common-lib';
import {
	AttendanceBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	GenBackend,
	getCombinedAttendanceBackend,
	getRawMySQLBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const getRecord = (backend: Backends<[MemberBackend]>) => (
	req: ServerAPIRequestParameter<api.events.attendance.Add>,
) => (event: EventObject) => (teamMaybe: MaybeObj<RawTeamObject>) =>
	(isValidMemberReference(req.body.memberID) &&
	hasBasicAttendanceManagementPermission(req.member)(event)(teamMaybe)
		? backend.getMember(req.account)(req.body.memberID)
		: asyncRight(req.member, errorGenerator('Could not get member'))
	)
		.map(toReference)
		.map<Required<NewAttendanceRecord>>(memberID => ({
			...req.body,
			customAttendanceFieldValues: applyCustomAttendanceFields(event.customAttendanceFields)(
				req.body.customAttendanceFieldValues,
			),
			shiftTime: req.body.shiftTime ?? null,
			memberID,
		}));

const addAttendance: Endpoint<
	Backends<
		[
			TimeBackend,
			EventsBackend,
			TeamsBackend,
			MemberBackend,
			RawMySQLBackend,
			AttendanceBackend,
		]
	>,
	api.events.attendance.Add
> = backend => req =>
	backend
		.getEvent(req.account)(req.params.id)
		.flatMap(backend.getFullEventObject)
		.flatMap(event =>
			(event.teamID !== undefined && event.teamID !== null
				? backend.getTeam(req.account)(event.teamID).map(Maybe.some)
				: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
			).map(teamMaybe => [event, teamMaybe] as const),
		)
		.flatMap(([event, teamMaybe]) =>
			getRecord(backend)(req)(event)(teamMaybe)
				.flatMap(rec =>
					Either.map<ServerError, void, Required<NewAttendanceRecord>>(always(rec))(
						Either.leftMap<string, ServerError, void>(err => ({
							type: 'OTHER',
							code: 400,
							message: err,
						}))(
							hasBasicAttendanceManagementPermission(req.member)(event)(teamMaybe)
								? canSignSomeoneElseUpForEvent(event)(rec.memberID)
								: canSignUpForEvent(event)(teamMaybe)(rec.memberID),
						),
					),
				)
				.flatMap(
					backend.addMemberToAttendance(event)(
						hasBasicAttendanceManagementPermission(req.member)(event)(teamMaybe),
					),
				),
		)
		.map(wrapper);

export const func: Endpoint<
	Backends<
		[
			TimeBackend,
			EventsBackend,
			TeamsBackend,
			MemberBackend,
			RawMySQLBackend,
			AttendanceBackend,
		]
	>,
	api.events.attendance.Add
> = backend =>
	PAM.RequireSessionType(
		SessionType.REGULAR,
		SessionType.SCAN_ADD,
	)(request =>
		asyncRight(request, errorGenerator('Could not process request'))
			.filter(
				req =>
					req.session.type === SessionType.REGULAR ||
					(req.session.sessionData.accountID === req.account.id &&
						req.session.sessionData.eventID.toString() === req.params.id),
				{
					type: 'OTHER',
					code: 403,
					message: 'Current session cannot add attendance to this event',
				},
			)
			.flatMap(addAttendance(backend)),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[RawMySQLBackend, GenBackend<ReturnType<typeof getCombinedAttendanceBackend>>]
	>(getRawMySQLBackend, getCombinedAttendanceBackend()),
);
