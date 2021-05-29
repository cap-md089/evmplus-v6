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

import { complement, pipe } from 'ramda';
import { ServerError } from '../typings/api';
import {
	CAPMember,
	CAPMemberContact,
	CAPMemberReference,
	CAPNHQMemberReference,
	CAPProspectiveMemberReference,
	ClientUser,
	Member,
	MemberPermission,
	MemberReference,
	PermissionForName,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	User,
} from '../typings/types';
import { Either, EitherObj } from './Either';
import { Maybe, MaybeObj } from './Maybe';

export const stringifyMemberReference = (ref: MemberReference): string => `${ref.type}-${ref.id}`;

const toCAPNHQReference = (id: number): CAPNHQMemberReference => ({
	type: 'CAPNHQMember',
	id,
});

export const toReference = <T extends MemberReference>(member: T): T =>
	({
		type: member.type,
		id: member.id,
	} as T);

export const parseStringMemberReference: (
	ref: string,
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
					Either.map(toCAPNHQReference),
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
			  }),
	),
);

export const getMemberPhone = (contact: CAPMemberContact): MaybeObj<string> =>
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
			contact.CADETPARENTPHONE.EMERGENCY,
	);

export const getMemberEmail = (contact: CAPMemberContact): MaybeObj<string> =>
	Maybe.fromValue(
		contact.EMAIL.PRIMARY ||
			contact.CADETPARENTEMAIL.PRIMARY ||
			contact.EMAIL.SECONDARY ||
			contact.CADETPARENTEMAIL.SECONDARY ||
			contact.EMAIL.EMERGENCY ||
			contact.CADETPARENTEMAIL.EMERGENCY,
	);

export const getMemberEmails = (contact: CAPMemberContact): string[] =>
	[
		contact.EMAIL.PRIMARY,
		contact.CADETPARENTEMAIL.PRIMARY,
		contact.EMAIL.SECONDARY,
		contact.CADETPARENTEMAIL.SECONDARY,
	].filter((v): v is string => !!v);

export const areMembersTheSame = (ref1: MemberReference) => (ref2: MemberReference): boolean =>
	ref1.type === ref2.type && ref1.id === ref2.id;

export const getMemberName = (member: {
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
}): string =>
	[member.nameFirst, member.nameLast, member.nameSuffix]
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
	threshold: number,
) => (user: ClientUser): boolean =>
	// @ts-ignore: enum type specificity vs reality is a pain
	user.permissions[permission] === threshold || isRioux(user);

export const hasPermission = <T extends MemberPermission>(permission: T) => (
	threshold: PermissionForName<T>,
) => (user: ClientUser): boolean =>
	// @ts-ignore: enum type specificity vs reality is a pain
	user.permissions[permission] === threshold || isRioux(user);

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

export const hasDutyPosition = (dutyPosition: string) => (member: CAPMember): boolean =>
	isRioux(member) || member.dutyPositions.map(duty => duty.duty).includes(dutyPosition);

export const hasDutyPositions = (dutyPositions: string[]) => (member: CAPMember): boolean =>
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

export function isValidMemberReference(value: unknown): value is MemberReference {
	if (typeof value !== 'object' || value === null || value === undefined) {
		return false;
	}

	if (
		!('type' in value) ||
		typeof (value as { type: unknown }).type !== 'string' ||
		!('id' in value)
	) {
		return false;
	}

	const val2 = value as { type: string; id: unknown };

	if (val2.type === 'CAPNHQMember' && typeof val2.id === 'number') {
		return true;
	}

	if (val2.type === 'CAPProspectiveMember' && typeof val2.id === 'string') {
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
	dutyPosition: ShortDutyPosition,
): dutyPosition is ShortCAPUnitDutyPosition => dutyPosition.type === 'CAPUnit';

export const isRequesterRioux = <T extends { member: User }>(req: T): boolean =>
	isRioux(req.member);
