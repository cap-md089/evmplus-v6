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

import { pipe } from 'ramda';
import {
	AttendanceRecord,
	ClientUser,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldValue,
	EventObject,
	EventType,
	MemberReference,
	Permissions,
	PointOfContactType,
	RawResolvedEventObject,
	RawTeamObject,
	User,
} from '../typings/types';
import { Either, EitherObj } from './Either';
import { Maybe, MaybeObj } from './Maybe';
import {
	areMembersTheSame,
	hasDutyPositions,
	hasOneDutyPosition,
	hasPermission,
	isCAPMember,
	isRioux,
} from './Member';
import { isPartOfTeam, isTeamLeader } from './Team';
import { complement, destroy, get } from './Util';

export const isPOCOf = (member: MemberReference, event: RawResolvedEventObject) =>
	(member.type === 'CAPNHQMember' && (member.id === 546319 || member.id === 542488)) ||
	areMembersTheSame(member)(event.author) ||
	event.pointsOfContact
		.map(
			poc =>
				poc.type === PointOfContactType.INTERNAL &&
				areMembersTheSame(member)(poc.memberReference),
		)
		.reduce((prev, curr) => prev || curr, false);

export const canSignUpForEvent = (event: EventObject) => (
	eventTeam: MaybeObj<RawTeamObject>,
): ((memberInput?: MemberReference | null) => EitherObj<string, void>) =>
	pipe(
		Either.right,
		Either.filterType<string, MemberReference | null | undefined, MemberReference>(
			(member): member is MemberReference => !!member,
		)('Cannot sign up without being signed in'),
		Either.filter<string, MemberReference>(complement(hasMember(event)))(
			'Member is already in attendance',
		),
		Either.filter<string, MemberReference>(() => event.acceptSignups)(
			event.signUpDenyMessage || 'Sign ups are not allowed for this event',
		),
		Either.filter<string, MemberReference>(
			member =>
				event.teamID === null ||
				event.teamID === undefined ||
				!event.limitSignupsToTeam ||
				Maybe.orSome(false)(Maybe.map(isPartOfTeam(member))(eventTeam)),
		)('Member is required to be a part of the team'),
		Either.filter<string, MemberReference>(
			() =>
				event.registration === null ||
				event.registration === undefined ||
				event.registration.deadline > +new Date(),
		)('Cannot sign up for event after registration deadline'),
		Either.map(destroy),
	);

export const canSignSomeoneElseUpForEvent = (
	event: EventObject,
): ((memberInput: MemberReference) => EitherObj<string, void>) =>
	pipe(
		Either.right,
		Either.filter<string, MemberReference>(complement(hasMember(event)))(
			'Member is already in attendance',
		),
		Either.map(destroy),
	);

export const getURIComponent = (event: RawResolvedEventObject) =>
	`${event.id}-${event.name.toLocaleLowerCase().replace(/ /g, '-')}`;

export const hasMember = (event: EventObject) => (member: MemberReference) =>
	event.attendance.map(get('memberID')).filter(areMembersTheSame(member)).length > 0;

export const hasBasicEventPermissions = (member: User) =>
	hasPermission('ManageEvent')(Permissions.ManageEvent.ADDDRAFTEVENTS)(member) ||
	hasPermission('ManageEvent')(Permissions.ManageEvent.FULL)(member) ||
	((member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') &&
		hasOneDutyPosition([
			'Operations Officer',
			'Cadet Operations Officer',
			'Cadet Operations NCO',
			'Activities Officer',
			'Squadron Activities Officer',
			'Cadet Activities Officer',
			'Cadet Activities NCO',
		])(member));

export const getAttendanceRecordForMember = (attendance: AttendanceRecord[]) => (
	member: MemberReference,
): AttendanceRecord | undefined => attendance.find(val => areMembersTheSame(member)(val.memberID));

export const canManageEvent = (member: User) => (event: RawResolvedEventObject) =>
	isPOCOf(member, event) ||
	[Permissions.ManageEvent.FULL, Permissions.ManageEvent.ADDDRAFTEVENTS].includes(
		effectiveManageEventPermissionForEvent(member)(event),
	);

export const canFullyManageEvent = (member: User) => (event: RawResolvedEventObject) =>
	isPOCOf(member, event) ||
	effectiveManageEventPermissionForEvent(member)(event) === Permissions.ManageEvent.FULL;

export const canMaybeManageEvent = (member: MaybeObj<User>) => (event: RawResolvedEventObject) =>
	Maybe.isSome(member) ? canManageEvent(member.value)(event) : false;

export const canMaybeFullyManageEvent = (member: MaybeObj<User>) => (
	event: RawResolvedEventObject,
) => (Maybe.isSome(member) ? canFullyManageEvent(member.value)(event) : false);

const orderedManageEventPermissions = [
	Permissions.ManageEvent.NONE,
	Permissions.ManageEvent.ADDDRAFTEVENTS,
	Permissions.ManageEvent.FULL,
];

const permissionIndex = (perm: Permissions.ManageEvent) =>
	orderedManageEventPermissions.indexOf(perm);

export const effectiveManageEventPermission = (member: ClientUser) =>
	orderedManageEventPermissions[
		Math.max(
			(member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') &&
				hasOneDutyPosition([
					'Operations Officer',
					'Activities Officer',
					'Squadron Activities Officer',
				])(member)
				? 2
				: 0,
			(member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') &&
				hasOneDutyPosition([
					'Cadet Operations Officer',
					'Cadet Operations NCO',
					'Cadet Activities Officer',
					'Cadet Activities NCO',
				])(member)
				? 1
				: 0,
			permissionIndex(member.permissions.ManageEvent),
			isRioux(member) ? 2 : 0,
		)
	];

export const effectiveManageEventPermissionForEvent = (member: ClientUser) => (
	event: RawResolvedEventObject,
) =>
	orderedManageEventPermissions[
		Math.max(
			permissionIndex(effectiveManageEventPermission(member)),
			isPOCOf(member, event) ? 2 : 0,
		)
	];

export const defaultCustomAttendanceFieldValue = (
	field: CustomAttendanceField,
): CustomAttendanceFieldValue => ({
	title: field.title,
	...(field.type === CustomAttendanceFieldEntryType.CHECKBOX
		? { type: field.type, value: field.preFill }
		: field.type === CustomAttendanceFieldEntryType.DATE ||
		  field.type === CustomAttendanceFieldEntryType.NUMBER
		? { type: field.type, value: field.preFill }
		: field.type === CustomAttendanceFieldEntryType.FILE
		? { type: field.type, value: [] }
		: { type: field.type, value: field.preFill }),
});

export const applyCustomAttendanceFields = (eventFields: CustomAttendanceField[]) => (
	memberFields: CustomAttendanceFieldValue[],
) =>
	eventFields.map(
		customField =>
			memberFields.find(({ title }) => title === customField.title) ??
			defaultCustomAttendanceFieldValue(customField),
	);

/**
 * See if someone has the ability to add attendeees to an event and modify attendance for
 * an event
 *
 * @param member the member to check permissions for
 * @param event the event that has attendance the member wants to modify
 * @param team the team that belongs to the event, used for checking team leadership
 */
export const hasBasicAttendanceManagementPermission = (member: User) => (
	event: RawResolvedEventObject,
) => (team: MaybeObj<RawTeamObject>) =>
	// Event management permissions
	effectiveManageEventPermissionForEvent(member)(event) === Permissions.ManageEvent.FULL ||
	// CAP duty positions
	(isCAPMember(member) &&
		hasDutyPositions([
			'Cadet Executive Officer',
			'Cadet Administrative Officer',
			'Cadet Administrative NCO',
		])(member)) ||
	// Team leadership
	(Maybe.isSome(team) &&
		team.value.id === event.teamID &&
		(event.type === EventType.REGULAR || event.targetAccountID === team.value.accountID) &&
		isTeamLeader(member)(team.value));
