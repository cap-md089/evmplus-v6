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

import * as mysql from '@mysql/xdevapi';
import { always, asyncRight, BasicMySQLRequest, errorGenerator } from 'common-lib';
import {
	AuditsBackend,
	getAuditsBackend,
	getRequestFreeAttendanceBackend,
	getRequestFreeEventsBackend,
} from '.';
import {
	AccountBackend,
	BasicAccountRequest,
	getAccountBackend,
	getRequestFreeAccountsBackend,
} from './Account';
import { getAttendanceBackend, AttendanceBackend } from './Attendance';
import { getRequestFreeAuditsBackend } from './Audits';
import { Backends, combineBackends, GenBackend, getTimeBackend, TimeBackend } from './backends';
import { EventsBackend, getEventsBackend } from './Event';
import { FileBackend, getFileBackend } from './File';
import {
	getGoogleBackend,
	getRequestFreeGoogleBackend,
	GoogleBackend,
	GoogleConfiguration,
} from './GoogleUtils';
import { CAP } from './member/members';
import { getPAMBackend, PAMBackend } from './member/pam';
import { getMemberBackend, MemberBackend, getRequestFreeMemberBackend } from './Members';
import { RawMySQLBackend, requestlessMySQLBackend } from './MySQLUtil';
import { getRegistryBackend, RegistryBackend, getRequestFreeRegistryBackend } from './Registry';
import { EmailBackend, getEmailBackend } from './sendEmail';
import { getTaskBackend, TaskBackend } from './Task';
import { getTeamsBackend, TeamsBackend, getRequestFreeTeamsBackend } from './Team';

export const getCombinedMemberBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<[AccountBackend, CAP.CAPMemberBackend, TimeBackend, TeamsBackend, MemberBackend]>) =>
	combineBackends<
		BasicMySQLRequest,
		[AccountBackend, CAP.CAPMemberBackend, TimeBackend, TeamsBackend, MemberBackend]
	>(
		getAccountBackend,
		CAP.getCAPMemberBackend,
		getTimeBackend,
		getTeamsBackend,
		getMemberBackend,
	);

export const getCombinedTeamsBackend = (): ((
	req: BasicAccountRequest,
) => Backends<[TimeBackend, TeamsBackend]>) =>
	combineBackends<BasicAccountRequest, [TimeBackend, TeamsBackend]>(
		getTimeBackend,
		getTeamsBackend,
	);

export const getDefaultAccountBackend = (): ((
	req: BasicAccountRequest,
) => Backends<[RawMySQLBackend, AccountBackend, RegistryBackend]>) =>
	combineBackends<
		BasicAccountRequest,
		[Backends<[RawMySQLBackend, AccountBackend, RegistryBackend]>]
	>(req => req.backend);

export const getCombinedAuditsBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<[TimeBackend, CAP.CAPMemberBackend, TeamsBackend, MemberBackend, AuditsBackend]>) =>
	combineBackends<
		BasicMySQLRequest,
		[TimeBackend, Backends<[CAP.CAPMemberBackend, TeamsBackend, MemberBackend]>, AuditsBackend]
	>(getTimeBackend, getCombinedMemberBackend(), getAuditsBackend);

export const getCombinedPAMBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<[TimeBackend, AccountBackend, MemberBackend, PAMBackend]>) =>
	combineBackends<
		BasicMySQLRequest,
		[TimeBackend, Backends<[AccountBackend, MemberBackend]>, PAMBackend]
	>(getTimeBackend, getCombinedMemberBackend(), getPAMBackend);

export const getCombinedEventsBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<
	[
		EmailBackend,
		CAP.CAPMemberBackend,
		TeamsBackend,
		MemberBackend,
		TimeBackend,
		RegistryBackend,
		AccountBackend,
		AuditsBackend,
		GoogleBackend,
		EventsBackend,
	]
>) =>
	combineBackends<
		BasicMySQLRequest,
		[
			EmailBackend,
			CAP.CAPMemberBackend,
			TimeBackend,
			TeamsBackend,
			MemberBackend,
			RegistryBackend,
			AccountBackend,
			AuditsBackend,
			GoogleBackend,
			EventsBackend,
		]
	>(
		getEmailBackend,
		CAP.getCAPMemberBackend,
		getTimeBackend,
		getTeamsBackend,
		getMemberBackend,
		getRegistryBackend,
		getAccountBackend,
		getCombinedAuditsBackend(),
		getGoogleBackend,
		getEventsBackend,
	);

export const getCombinedAttendanceBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<
	[
		AccountBackend,
		TimeBackend,
		CAP.CAPMemberBackend,
		TeamsBackend,
		MemberBackend,
		EventsBackend,
		AttendanceBackend,
	]
>) =>
	combineBackends<
		BasicMySQLRequest,
		[
			AccountBackend,
			TimeBackend,
			CAP.CAPMemberBackend,
			TeamsBackend,
			MemberBackend,
			EventsBackend,
			AttendanceBackend,
		]
	>(
		getAccountBackend,
		getTimeBackend,
		CAP.getCAPMemberBackend,
		getTeamsBackend,
		getMemberBackend,
		getCombinedEventsBackend(),
		getAttendanceBackend,
	);

export const getCombinedFileBackend = (): ((
	req: BasicMySQLRequest,
) => Backends<[GenBackend<ReturnType<typeof getCombinedMemberBackend>>, FileBackend]>) =>
	combineBackends<
		BasicMySQLRequest,
		[GenBackend<ReturnType<typeof getCombinedMemberBackend>>, FileBackend]
	>(getCombinedMemberBackend(), getFileBackend);

export const getCombinedTasksBackend = (): ((
	req: BasicAccountRequest,
) => Backends<[GenBackend<typeof getDefaultAccountBackend>, TimeBackend, TaskBackend]>) =>
	combineBackends<
		BasicAccountRequest,
		[GenBackend<typeof getDefaultAccountBackend>, TimeBackend, TaskBackend]
	>(getDefaultAccountBackend, getTimeBackend, getTaskBackend);

export interface DefaultTestBackendOptions<T> {
	overrides?: Partial<T>;
	googleConfiguration?: GoogleConfiguration;
}

export const getDefaultTestBackend = <
	T extends Backends<
		[
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
		]
	>
>(
	opts?: DefaultTestBackendOptions<T>,
): ((
	mysql: mysql.Schema,
) => Backends<
	[
		T,
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
	]
>) =>
	combineBackends<
		mysql.Schema,
		[
			T,
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
		]
	>(
		always(opts?.overrides) as () => T,
		(): EmailBackend => ({ sendEmail: () => () => asyncRight(void 0, errorGenerator('')) }),
		requestlessMySQLBackend,
		getTimeBackend,
		getRequestFreeRegistryBackend,
		getRequestFreeAccountsBackend,
		getRequestFreeTeamsBackend,
		CAP.getRequestFreeCAPMemberBackend,
		getRequestFreeMemberBackend,
		getRequestFreeAuditsBackend,
		// eslint-disable-next-line
		(schema, curr) => getRequestFreeGoogleBackend(opts?.googleConfiguration!, curr),
		getRequestFreeEventsBackend,
		getRequestFreeAttendanceBackend,
	);
