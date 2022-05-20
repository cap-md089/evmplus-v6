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

// Regular exports
export {
	AccountBackend,
	accountRequestTransformer,
	BasicAccountRequest,
	getAccountBackend,
	getAccountID,
	getEmptyAccountBackend,
	getRequestFreeAccountsBackend,
} from './Account';
export {
	AttendanceBackend,
	getAttendanceBackend,
	getEmptyAttendanceBackend,
	getRequestFreeAttendanceBackend,
} from './Attendance';
export { AuditsBackend, getAuditsBackend, getRequestFreeAuditsBackend } from './Audits';
export {
	BackedServerAPIEndpoint,
	Backends,
	combineBackends,
	GenBackend,
	getEmptyRandomBackend,
	getRandomBackend,
	getTimeBackend,
	RandomBackend,
	TimeBackend,
	withBackends,
} from './backends';
export { getChangeLogBackend, ChangeLogBackend } from './ChangeLog';
export * as conf from './conf';
export * from './Error';
export {
	EventsBackend,
	getEmptyEventsBackend,
	getEventsBackend,
	getRequestFreeEventsBackend,
} from './Event';
export {
	FileBackend,
	getFileBackend,
	getRequestFreeFileBackend,
	getRootFileObject,
	getRootFileObjectForUser,
} from './File';
export * from './GoogleUtils';
export { default as ImportCAPWATCHFile } from './ImportCAPWATCHFile';
export * as PAM from './member/pam';
export {
	CAP,
	getEmptyMemberBackend,
	getMemberBackend,
	getRequestFreeMemberBackend,
	MemberBackend,
} from './Members';
export * from './MySQLUtil';
export * from './Notification';
export * from './Organizations';
export {
	getEmptyRegistryBackend,
	getRegistryBackend,
	getRequestFreeRegistryBackend,
	RegistryBackend,
} from './Registry';
export {
	EmailBackend,
	EmailParameters,
	EmailSetup,
	EmailToSend,
	getEmailBackend,
	getEmailMessageBody,
	getEmptyEmailBackend,
	SYSTEM_BCC_ADDRESS,
} from './sendEmail';
export * from './servertypes';
export { getTaskBackend, TaskBackend } from './Task';
export {
	getRequestFreeTeamsBackend,
	getTeamsBackend,
	httpStripTeamObject,
	TeamsBackend,
} from './Team';

// Needs to be last, as it imports stuff from all of the files above and uses them immediately
export * from './defaultBackends';
