import { complement, pipe } from 'ramda';
import { ServerError } from '../typings/api';
import {
	CAPMember,
	CAPMemberContact,
	CAPMemberReference,
	CAPNHQMemberReference,
	CAPProspectiveMemberReference,
	Member,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	User,
} from '../typings/types';
import { Either, EitherObj } from './Either';
import { Maybe } from './Maybe';

export const stringifyMemberReference = (ref: MemberReference) => `${ref.type}-${ref.id}`;

const toCAPNHQReference = (id: number): CAPNHQMemberReference => ({
	type: 'CAPNHQMember',
	id,
});

export const toReference = (member: MemberReference): MemberReference =>
	({
		type: member.type,
		id: member.id,
	} as MemberReference);

export const parseStringMemberReference: (
	ref: string
) => EitherObj<ServerError, MemberReference> = pipe(
	Either.right,
	Either.map<ServerError, string, string[]>(str => str.split('-')),
	Either.map<ServerError, string[], [string, string]>(([type, ...idparts]) => [
		type,
		idparts.join('-'),
	]),
	Either.flatMap<ServerError, string[], CAPMemberReference>(([type, id]) =>
		type === 'CAPNHQMember'
			? pipe(
					(x: string) => parseInt(x, 10),
					Either.right,
					Either.filter<ServerError, number>(complement(isNaN))({
						type: 'OTHER',
						code: 400,
						message: 'Invalid member ID',
					}),
					Either.map(toCAPNHQReference)
			  )(id)
			: type === 'CAPProspectiveMember'
			? Either.right<ServerError, CAPProspectiveMemberReference>({
					type: 'CAPProspectiveMember',
					id,
			  })
			: Either.left({
					type: 'OTHER',
					code: 400,
					message: 'Invalid member type',
			  })
	)
);

export const getMemberPhone = (contact: CAPMemberContact) =>
	Maybe.fromValue(
		contact.CELLPHONE.PRIMARY ||
			contact.WORKPHONE.PRIMARY ||
			contact.HOMEPHONE.PRIMARY ||
			contact.CADETPARENTPHONE.PRIMARY ||
			contact.CELLPHONE.SECONDARY ||
			contact.WORKPHONE.SECONDARY ||
			contact.HOMEPHONE.SECONDARY ||
			contact.CADETPARENTPHONE.SECONDARY ||
			contact.CELLPHONE.EMERGENCY ||
			contact.WORKPHONE.EMERGENCY ||
			contact.HOMEPHONE.EMERGENCY ||
			contact.CADETPARENTPHONE.EMERGENCY
	);

export const getMemberEmail = (contact: CAPMemberContact) =>
	Maybe.fromValue(
		contact.EMAIL.PRIMARY ||
			contact.CADETPARENTEMAIL.PRIMARY ||
			contact.EMAIL.SECONDARY ||
			contact.CADETPARENTEMAIL.SECONDARY ||
			contact.EMAIL.EMERGENCY ||
			contact.CADETPARENTEMAIL.EMERGENCY
	);

export const areMembersTheSame = (ref1: MemberReference) => (ref2: MemberReference) =>
	ref1.type === ref2.type && ref1.id === ref2.id;

export const getMemberName = (member: {
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
}) =>
	[member.nameFirst, member.nameMiddle.charAt(0), member.nameLast, member.nameSuffix]
		.filter(s => !!s)
		.map(value => value.trimLeft().trimRight())
		.map(value => value.replace(/\r\n/gm, ''))
		.map(value => value.replace(/(  +)/g, ' '))
		.join(' ');

export const getFullMemberName = (member: {
	memberRank: string;
	nameFirst: string;
	nameLast: string;
	nameMiddle: string;
	nameSuffix: string;
}): string =>
	// member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember'
	// 	? Maybe.some(
	member.memberRank + ' ' + getMemberName(member);
//   )
// : Maybe.none();

export const hasSpecificPermission = <T extends MemberPermission>(permission: T) => (
	threshold: MemberPermissions[T] = 1 as MemberPermissions[T]
) => (user: User) => user.permissions[permission] === threshold || isRioux(user);

export const hasPermission = <T extends MemberPermission>(permission: T) => (
	threshold: MemberPermissions[T] = 1 as MemberPermissions[T]
) => (user: User) => user.permissions[permission] >= threshold || isRioux(user);

export const asReference = (member: Member): MemberReference =>
	member.type === 'CAPNHQMember'
		? {
				type: 'CAPNHQMember',
				id: member.id,
		  }
		: {
				type: 'CAPProspectiveMember',
				id: member.id,
		  };

export const hasDutyPosition = (dutyPosition: string) => (member: CAPMember) =>
	isRioux(member) || member.dutyPositions.map(duty => duty.duty).includes(dutyPosition);

export const hasDutyPositions = (dutyPositions: string[]) => (member: CAPMember) =>
	dutyPositions.some(duty => hasDutyPosition(duty)(member));

export const hasOneDutyPosition = hasDutyPositions;

export function isRioux(cm: MemberReference | number | string): boolean {
	if (typeof cm === 'number' || typeof cm === 'string') {
		return cm === 542488 || cm === 546319;
	}

	if ('id' in cm) {
		return isRioux(cm.id);
	}

	return false;
}

export function getUserID(name: string[]): string {
	let usrID = '';

	usrID = name[2] + ((name[0] || '')[0] || '') + ((name[1] || '')[0] || '');

	return usrID.toLocaleLowerCase();
}

export function isValidMemberReference(value: any): value is MemberReference {
	if (typeof value !== 'object' || value === null || value === undefined) {
		return false;
	}

	if (typeof value.type === 'undefined') {
		return false;
	}

	if (value.type === 'Null') {
		return true;
	}

	if (value.type === 'CAPNHQMember' && typeof value.id === 'number') {
		return true;
	}

	if (value.type === 'CAPProspectiveMember' && typeof value.id === 'string') {
		return true;
	}

	return false;
}

export const getFullNameLFMI = (member: Member): string => {
	let buildName = member.nameLast + ', ' + member.nameFirst;
	if (member.nameMiddle) {
		buildName += ' ' + member.nameMiddle[0];
	}
	if (member.nameSuffix) {
		buildName += ', ' + member.nameSuffix;
	}
	return buildName;
};

export const isCAPMember = (member: Member): member is CAPMember =>
	member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember';

export const isCAPUnitDutyPosition = (
	dutyPosition: ShortDutyPosition
): dutyPosition is ShortCAPUnitDutyPosition => dutyPosition.type === 'CAPUnit';
