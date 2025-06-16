/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	AccountType,
	CAPAccountObject,
	ClientUser,
	Permissions,
	RawCAPSquadronAccountObject,
	RegularCAPAccountObject,
} from '../typings/types';
import { Maybe, MaybeObj } from './Maybe';
import { hasPermission, isCAPMember, isRioux } from './Member';

export const isRegularCAPAccountObject = (
	account: AccountObject,
): account is RegularCAPAccountObject =>
	account.type === AccountType.CAPGROUP ||
	account.type === AccountType.CAPREGION ||
	account.type === AccountType.CAPSQUADRON ||
	account.type === AccountType.CAPWING;

export const getORGIDFromAccount = (account: RegularCAPAccountObject): number =>
	account.type === AccountType.CAPSQUADRON ? account.mainOrg : account.orgid;

export const renderAccountID = (account: RawCAPSquadronAccountObject): string =>
	`${account.id.replace(/([a-zA-Z]{3})([a-zA-Z]{2})([0-9]*)/, '$1-$2-$3').toUpperCase()}`;

export const getEmbedLink = (account: AccountObject): string =>
	`<iframe src=\"https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
		account.mainCalendarID,
	)}&ctz=America%2FNew_York\" style=\"border: 0\" width=\"720\" height=\"540\" frameborder=\"0\" scrolling=\"no\"></iframe>`;

export const getORGIDsFromCAPAccount = (account: CAPAccountObject): MaybeObj<number[]> =>
	account.type === AccountType.CAPSQUADRON
		? Maybe.some([account.mainOrg, ...account.orgIDs])
		: account.type === AccountType.CAPGROUP || account.type === AccountType.CAPREGION
		? Maybe.some([account.orgid])
		: account.type === AccountType.CAPWING
		? Maybe.some([account.orgid, ...account.orgIDs])
		: Maybe.none();

export const getORGIDsFromRegularCAPAccount = (account: RegularCAPAccountObject): number[] =>
	account.type === AccountType.CAPWING
		? [account.orgid, ...account.orgIDs]
		: account.type === AccountType.CAPSQUADRON
		? [account.mainOrg, ...account.orgIDs]
		: [account.orgid];

export const canCreateCAPEventAccount = (parent: CAPAccountObject) => (
	user: ClientUser,
): boolean => {
	const duties = user.dutyPositions
		.filter(
			duty =>
				duty.type === 'CAPUnit' ||
				Maybe.orSome<number[]>([])(getORGIDsFromCAPAccount(parent)).includes(duty.orgid),
		)
		.map(({ duty }) => duty);

	return (
		isRioux(user) ||
		((parent.type === AccountType.CAPWING || parent.type === AccountType.CAPREGION) &&
			isCAPMember(user) &&
			(duties.includes('Commander') ||
				duties.includes('Information Technologies Officer') ||
				hasPermission('CreateEventAccount')(Permissions.CreateEventAccount.YES)(user)))
	);
};
