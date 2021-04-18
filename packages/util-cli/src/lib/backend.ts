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
	AccountBackend,
	AuditsBackend,
	CAP,
	combineBackends,
	EventsBackend,
	FileBackend,
	getRequestFreeAccountsBackend,
	getRequestFreeAuditsBackend,
	getRequestFreeEventsBackend,
	getRequestFreeFileBackend,
	getRequestFreeMemberBackend,
	getRequestFreeRegistryBackend,
	getRequestFreeTeamsBackend,
	getTimeBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	RegistryBackend,
	requestlessMySQLBackend,
	TeamsBackend,
	TimeBackend,
} from 'server-common';

export const backendGenerator = combineBackends<
	Schema,
	[
		TimeBackend,
		RawMySQLBackend,
		RegistryBackend,
		AccountBackend,
		TeamsBackend,
		CAP.CAPMemberBackend,
		MemberBackend,
		FileBackend,
		AuditsBackend,
		EventsBackend,
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
	getRequestFreeFileBackend,
	getRequestFreeAuditsBackend,
	getRequestFreeEventsBackend,
	PAM.getRequestFreePAMBackend,
);
