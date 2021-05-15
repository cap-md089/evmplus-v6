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

import { validator } from 'auto-client-api';
import {
	always,
	api,
	AsyncEither,
	asyncIterHandler,
	asyncIterMap,
	asyncRight,
	canFullyManageEvent,
	collectGeneratorAsync,
	destroy,
	errorGenerator,
	EventObject,
	getFullMemberName,
	getMemberEmail,
	hasBasicAttendanceManagementPermission,
	Maybe,
	MaybeObj,
	Member,
	NewAttendanceRecord,
	RawEventObject,
	RawResolvedEventObject,
	RawTeamObject,
	RegistryValues,
	ServerError,
	SessionType,
	Validator,
} from 'common-lib';
import { toHTML } from 'markdown';
import {
	AttendanceBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EmailBackend,
	EmailSetup,
	EventsBackend,
	GenBackend,
	getCombinedAttendanceBackend,
	getEmailBackend,
	getRawMySQLBackend,
	getRegistryBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	RegistryBackend,
	SUPPORT_BCC_ADDRESS,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const bulkAttendanceValidator = new Validator({
	members: Validator.ArrayOf(
		Validator.Required(
			(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules,
		),
	),
});

export const func: Endpoint<
	Backends<
		[
			EventsBackend,
			TeamsBackend,
			RawMySQLBackend,
			TimeBackend,
			MemberBackend,
			AttendanceBackend,
			EmailBackend,
			RegistryBackend,
		]
	>,
	api.events.attendance.AddBulk
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(bulkAttendanceValidator)(request).flatMap(req =>
			AsyncEither.All([
				backend
					.getEvent(req.account)(req.params.id)
					.flatMap(backend.ensureResolvedEvent)
					.filter(canFullyManageEvent(req.member), {
						type: 'OTHER',
						code: 403,
						message: 'Member cannot perform this action',
					})
					.flatMap(backend.getFullEventObject)
					.flatMap<[EventObject, MaybeObj<RawTeamObject>]>(event =>
						!event.teamID
							? asyncRight<ServerError, [EventObject, MaybeObj<RawTeamObject>]>(
									[event, Maybe.none()],
									errorGenerator('Could not get team information'),
							  )
							: backend
									.getTeam(req.account)(event.teamID)
									.map<[EventObject, MaybeObj<RawTeamObject>]>(team => [
										event,
										Maybe.some(team),
									]),
					),
				backend.getRegistry(req.account),
			])

				.flatMap<RawEventObject>(([[event, teamMaybe], registry]) =>
					asyncRight(
						collectGeneratorAsync(
							asyncIterMap((rec: Required<NewAttendanceRecord>) =>
								backend
									.addMemberToAttendance(event)(
										hasBasicAttendanceManagementPermission(req.member)(event)(
											teamMaybe,
										),
									)(rec)
									.tap(writeEmail(backend)(registry)(req.member)(event)),
							)(req.body.members),
						),
						errorGenerator('Could not add attendance records'),
					).map(always(event)),
				)

				.flatMap(backend.getAttendanceForEvent)
				.map(asyncIterHandler(errorGenerator('Could not get attendance record')))
				.map(wrapper),
		),
	);

const getEmail = (member: Member) => (email: string) => (
	event: RawResolvedEventObject,
) => (emailBody: { body: string }): EmailSetup => ({ url }) => ({
	bccAddresses: [SUPPORT_BCC_ADDRESS],
	to: [email],
	subject: 'Event Signup Notice',
	textBody: emailBody.body.replace(/%%MEMBER_NAME%%/, getFullMemberName(member)),
	htmlBody: toHTML(emailBody.body.replace(/%%MEMBER_NAME%%/, getFullMemberName(member))),
});

const writeEmail = (backend: EmailBackend) => (registry: RegistryValues) => (member: Member) => (
	event: RawResolvedEventObject,
) => () => {
	const emailMaybe = getMemberEmail(member.contact);
	const emailBody = event.emailBody ?? Maybe.none();

	if (Maybe.isSome(emailMaybe) && Maybe.isSome(emailBody)) {
		return backend
			.sendEmail(registry)(getEmail(member)(emailMaybe.value)(event)(emailBody.value))
			.map(destroy);
	} else {
		return asyncRight(void 0, errorGenerator('Could not send email'));
	}
};

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[
			RawMySQLBackend,
			GenBackend<ReturnType<typeof getCombinedAttendanceBackend>>,
			EmailBackend,
			RegistryBackend,
		]
	>(getRawMySQLBackend, getCombinedAttendanceBackend(), getEmailBackend, getRegistryBackend),
);
