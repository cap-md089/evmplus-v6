/**
 * Copyright (C) 2021 Andrew Rioux
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

import { Schema } from '@mysql/xdevapi';
import { asyncRight, errorGenerator } from 'common-lib';
import {
	combineBackends,
	EventsBackend,
	getRequestFreeAccountsBackend,
	getRequestFreeAttendanceBackend,
	getRequestFreeEventsBackend,
	getRequestFreeMemberBackend,
	getRequestFreeAuditsBackend,
	getRequestFreeRegistryBackend,
	getRequestFreeTeamsBackend,
	MemberBackend,
	PAM,
	RegistryBackend,
	TeamsBackend,
	AuditsBackend,
	getTimeBackend,
	TimeBackend,
	requestlessMySQLBackend,
	RawMySQLBackend,
	AccountBackend,
	CAP,
	AttendanceBackend,
	Backends,
	GoogleBackend,
	getEmptyGoogleBackend,
	EmailBackend,
} from 'server-common';

export type DiscordBackends = Backends<
	[
		TimeBackend,
		RawMySQLBackend,
		RegistryBackend,
		AccountBackend,
		TeamsBackend,
		CAP.CAPMemberBackend,
		MemberBackend,
		AuditsBackend,
		GoogleBackend,
		EventsBackend,
		AttendanceBackend,
		PAM.PAMBackend,
	]
>;

export const getDiscordBackend = combineBackends<
	Schema,
	[
		EmailBackend,
		RawMySQLBackend,
		TimeBackend,
		RegistryBackend,
		AccountBackend,
		TeamsBackend,
		CAP.CAPMemberBackend,
		MemberBackend,
		AuditsBackend,
		GoogleBackend,
		EventsBackend,
		AttendanceBackend,
		PAM.PAMBackend,
	]
>(
	(): EmailBackend => ({ sendEmail: () => () => asyncRight(void 0, errorGenerator('')) }),
	requestlessMySQLBackend,
	getTimeBackend,
	getRequestFreeRegistryBackend,
	getRequestFreeAccountsBackend,
	getRequestFreeTeamsBackend,
	CAP.getRequestFreeCAPMemberBackend,
	getRequestFreeMemberBackend,
	getRequestFreeAuditsBackend,
	getEmptyGoogleBackend,
	getRequestFreeEventsBackend,
	getRequestFreeAttendanceBackend,
	PAM.getRequestFreePAMBackend,
);
