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
import { asyncRight, CLIConfiguration, errorGenerator } from 'common-lib';
import {
	AccountBackend,
	AuditsBackend,
	Backends,
	CAP,
	combineBackends,
	EmailBackend,
	EventsBackend,
	FileBackend,
	getRequestFreeAccountsBackend,
	getRequestFreeAuditsBackend,
	getRequestFreeEventsBackend,
	getRequestFreeFileBackend,
	getRequestFreeGoogleBackend,
	getRequestFreeMemberBackend,
	getRequestFreeRegistryBackend,
	getRequestFreeTeamsBackend,
	getTimeBackend,
	GoogleBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	RegistryBackend,
	requestlessMySQLBackend,
	TeamsBackend,
	TimeBackend,
} from 'server-common';

export const backendGenerator = (
	conf: CLIConfiguration,
): ((
	schema: Schema,
) => Backends<
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
		GoogleBackend,
		EventsBackend,
		PAM.PAMBackend,
	]
>) =>
	combineBackends<
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
			FileBackend,
			AuditsBackend,
			GoogleBackend,
			EventsBackend,
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
		getRequestFreeFileBackend,
		getRequestFreeAuditsBackend,
		(schema, backends) => getRequestFreeGoogleBackend(conf, backends),
		getRequestFreeEventsBackend,
		PAM.getRequestFreePAMBackend,
	);
