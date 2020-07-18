import { pipe } from 'ramda';
import {
	AttendanceRecord,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldValue,
	EventObject,
	MemberReference,
	Permissions,
	PointOfContactType,
	RawEventObject,
	User,
} from '../typings/types';
import { Either, EitherObj } from './Either';
import { Maybe, MaybeObj } from './Maybe';
import { areMembersTheSame, hasOneDutyPosition, hasPermission, isRioux } from './Member';
import { complement, destroy, get } from './Util';

export const isPOCOf = (member: MemberReference, event: RawEventObject) =>
	(member.type === 'CAPNHQMember' && (member.id === 546319 || member.id === 542488)) ||
	areMembersTheSame(member)(event.author) ||
	event.pointsOfContact
		.map(
			poc =>
				poc.type === PointOfContactType.INTERNAL &&
				areMembersTheSame(member)(poc.memberReference)
		)
		.reduce((prev, curr) => prev || curr, false);

export const canSignUpForEvent = (event: EventObject) => (
	eventTeamMembers: MemberReference[]
): ((memberInput?: MemberReference | null) => EitherObj<string, void>) =>
	pipe(
		Either.right,
		Either.filterType<string, MemberReference | null | undefined, MemberReference>(
			(member): member is MemberReference => !!member
		)('Cannot sign up without being signed in'),
		Either.filter<string, MemberReference>(complement(hasMember(event)))(
			'Member is already in attendance'
		),
		Either.filter<string, MemberReference>(() => event.acceptSignups)(
			event.signUpDenyMessage || 'Sign ups are not allowed for this event'
		),
		Either.filter<string, MemberReference>(
			member =>
				event.teamID === null ||
				event.teamID === undefined ||
				(!!event.limitSignupsToTeam &&
					eventTeamMembers.filter(areMembersTheSame(member)).length > 0)
		)('Member is required to be a part of the team'),
		Either.filter<string, MemberReference>(
			() =>
				event.registration === null ||
				event.registration === undefined ||
				event.registration.deadline > +new Date()
		)('Cannot sign up for event after registration deadline'),
		Either.map(destroy)
	);

export const getURIComponent = (event: RawEventObject) =>
	`${event.id}-${event.name.toLocaleLowerCase().replace(/ /g, '-')}`;

export const hasMember = (event: EventObject) => (member: MemberReference) =>
	event.attendance.map(get('memberID')).filter(areMembersTheSame(member)).length > 0;

export const hasBasicEventPermissions = (member: User) =>
	hasPermission('ManageEvent')(Permissions.ManageEvent.ADDDRAFTEVENTS)(member) ||
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
	member: MemberReference
): AttendanceRecord | undefined => attendance.find(val => areMembersTheSame(member)(val.memberID));

export const canManageEvent = (
	threshold: Permissions.ManageEvent = Permissions.ManageEvent.FULL
) => (member: User) => (event: RawEventObject) =>
	isPOCOf(member, event) || effectiveManageEventPermissionForEvent(member)(event) >= threshold;

export const canMaybeManageEvent = (
	threshold: Permissions.ManageEvent = Permissions.ManageEvent.FULL
) => (member: MaybeObj<User>) => (event: RawEventObject) =>
	Maybe.isSome(member) ? canManageEvent(threshold)(member.value)(event) : false;

export const effectiveManageEventPermission = (member: User) =>
	Math.max(
		(member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') &&
			hasOneDutyPosition([
				'Operations Officer',
				'Activities Officer',
				'Squadron Activities Officer',
			])
			? Permissions.ManageEvent.FULL
			: Permissions.ManageEvent.NONE,
		(member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') &&
			hasOneDutyPosition([
				'Cadet Operations Officer',
				'Cadet Operations NCO',
				'Cadet Activities Officer',
				'Cadet Activities NCO',
			])
			? Permissions.ManageEvent.ADDDRAFTEVENTS
			: Permissions.ManageEvent.NONE,
		member.permissions.ManageEvent,
		isRioux(member) ? Permissions.ManageEvent.FULL : Permissions.ManageEvent.NONE
	);

export const effectiveManageEventPermissionForEvent = (member: User) => (event: RawEventObject) =>
	Math.max(
		effectiveManageEventPermission(member),
		isPOCOf(member, event) ? Permissions.ManageEvent.FULL : Permissions.ManageEvent.NONE
	);

export const defaultCustomAttendanceFieldValue = (
	field: CustomAttendanceField
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
	memberFields: CustomAttendanceFieldValue[]
) =>
	eventFields.map(
		customField =>
			memberFields.find(({ title }) => title === customField.title) ??
			defaultCustomAttendanceFieldValue(customField)
	);
