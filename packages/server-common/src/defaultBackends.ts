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

import { BasicMySQLRequest } from 'common-lib';
import { AuditsBackend, getAuditsBackend } from '.';
import { AccountBackend, BasicAccountRequest, getAccountBackend } from './Account';
import { getAttendanceBackend, AttendanceBackend } from './Attendance';
import { Backends, combineBackends, GenBackend, getTimeBackend, TimeBackend } from './backends';
import { EventsBackend, getEventsBackend } from './Event';
import { FileBackend, getFileBackend } from './File';
import { CAP } from './member/members';
import { getPAMBackend, PAMBackend } from './member/pam';
import { getMemberBackend, MemberBackend } from './Members';
import { RawMySQLBackend } from './MySQLUtil';
import { getRegistryBackend, RegistryBackend } from './Registry';
import { getTaskBackend, TaskBackend } from './Task';
import { getTeamsBackend, TeamsBackend } from './Team';

export const getCombinedMemberBackend = combineBackends<
	BasicMySQLRequest,
	[AccountBackend, CAP.CAPMemberBackend, TimeBackend, TeamsBackend, MemberBackend]
>(getAccountBackend, CAP.getCAPMemberBackend, getTimeBackend, getTeamsBackend, getMemberBackend);

export const getCombinedTeamsBackend = combineBackends<
	BasicAccountRequest,
	[TimeBackend, TeamsBackend]
>(getTimeBackend, getTeamsBackend);

export const getDefaultAccountBackend = combineBackends<
	BasicAccountRequest,
	[Backends<[RawMySQLBackend, AccountBackend, RegistryBackend]>]
>(req => req.backend);

export const getCombinedAuditsBackend = combineBackends<
	BasicMySQLRequest,
	[TimeBackend, Backends<[CAP.CAPMemberBackend, TeamsBackend, MemberBackend]>, AuditsBackend]
>(getTimeBackend, getCombinedMemberBackend, getAuditsBackend);

export const getCombinedPAMBackend = combineBackends<
	BasicMySQLRequest,
	[TimeBackend, Backends<[AccountBackend, MemberBackend]>, PAMBackend]
>(getTimeBackend, getCombinedMemberBackend, getPAMBackend);

export const getCombinedEventsBackend = combineBackends<
	BasicMySQLRequest,
	[TimeBackend, RegistryBackend, AccountBackend, AuditsBackend, EventsBackend]
>(
	getTimeBackend,
	getRegistryBackend,
	getAccountBackend,
	getCombinedAuditsBackend,
	getEventsBackend,
);

export const getCombinedAttendanceBackend = combineBackends<
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
	getCombinedEventsBackend,
	getAttendanceBackend,
);

export const getCombinedFileBackend = combineBackends<
	BasicMySQLRequest,
	[GenBackend<typeof getCombinedMemberBackend>, FileBackend]
>(getCombinedMemberBackend, getFileBackend);

export const getCombinedTasksBackend = combineBackends<
	BasicAccountRequest,
	[GenBackend<typeof getDefaultAccountBackend>, TimeBackend, TaskBackend]
>(getDefaultAccountBackend, getTimeBackend, getTaskBackend);
