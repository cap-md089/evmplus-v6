/**
 * Copyright (C) 2021 Andrew Rioux
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
		EventsBackend,
		AttendanceBackend,
		PAM.PAMBackend,
	]
>;

export const getDiscordBackend = combineBackends<
	Schema,
	[
		TimeBackend,
		RawMySQLBackend,
		RegistryBackend,
		AccountBackend,
		TeamsBackend,
		CAP.CAPMemberBackend,
		MemberBackend,
		AuditsBackend,
		EventsBackend,
		AttendanceBackend,
		PAM.PAMBackend,
	]
>(
	getTimeBackend,
	requestlessMySQLBackend,
	getRequestFreeRegistryBackend,
	getRequestFreeAccountsBackend,
	getRequestFreeTeamsBackend,
	CAP.getRequestFreeCAPMemberBackend,
	getRequestFreeMemberBackend,
	getRequestFreeAuditsBackend,
	getRequestFreeEventsBackend,
	getRequestFreeAttendanceBackend,
	PAM.getRequestFreePAMBackend,
);
