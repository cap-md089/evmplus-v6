#!/usr/bin/env node
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Collection, getSession } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	AccountObject,
	AccountType,
	AttendanceRecord,
	AttendanceStatus,
	CAPEventMemberPermissions,
	CAPGroupMemberPermissions,
	CAPRegionMemberPermissions,
	CAPSquadronMemberPermissions,
	CAPWingMemberPermissions,
	CustomAttendanceFieldValue,
	Either,
	ExternalPointOfContact,
	identity,
	InternalPointOfContact,
	Maybe,
	MaybeObj,
	MemberReference,
	Permissions,
	PointOfContactType,
	RawEventObject,
	RawServerConfiguration,
	RawTeamObject,
	StoredMemberPermissions,
	stripProp,
	Validator,
	errorGenerator,
} from 'common-lib';
import 'dotenv/config';
import { confFromRaw, generateResults, getAccount } from 'server-common';
// const v5teamsCollection = v5schema.getCollection<RawTeamObject>('Teams');
const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

interface V5DiscordServerInformation {
	serverID: string;
	displayFlight: boolean;
}

interface V5NewAccountObject {
	adminIDs: MemberReference[];
	discordServer: MaybeObj<V5DiscordServerInformation>;
}

enum V5AccountType {
	CAPSQUADRON,
	CAPGROUP,
	CAPWING,
	CAPREGION,
	CAPEVENT,
}

// @ts-ignore
interface V5RawAccountObject extends V5NewAccountObject {
	id: string;
	mainCalendarID: string;
	wingCalendarID: string;
	serviceAccount: MaybeObj<string>;
	shareLink: string;
	comments: string;
	echelon: boolean;
	mainOrg: number;
	orgIDs: number[];
	paid: boolean;
	expires: number;
	paidEventLimit: number;
	unpaidEventLimit: number;
	aliases: string[];
	type: V5AccountType;
}

interface V5NewAttendanceRecord {
	comments: string;
	status: AttendanceStatus;
	planToUseCAPTransportation: boolean;
	arrivalTime: number | null;
	departureTime: number | null;
	memberID?: MemberReference;
	customAttendanceFieldValues: CustomAttendanceFieldValue[];
}

// @ts-ignore
interface V5AttendanceRecord extends V5NewAttendanceRecord {
	timestamp: number;
	memberID: MemberReference;
	memberName: string;
	summaryEmailSent: boolean;
	arrivalTime: number;
	departureTime: number;
}

// @ts-ignore
type RawAttendanceRecord<T> = Omit<T, 'sourceEventID' | 'sourceAccountID'> & {
	accountID: string;
	eventID: string;
};

type V5MemberPermissions = Omit<CAPSquadronMemberPermissions, 'type'>;

interface V5StoredMemberPermissions {
	member: MemberReference;
	accountID: string;
	permissions: V5MemberPermissions;
}

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

process.on('unhandledRejection', (up) => {
	throw up;
});

(async () => {
	const v5session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});
	const v6session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	// @ts-ignore
	const v5schema = v5session.getSchema('EventManagement4');

	// @ts-ignore
	const v6schema = v6session.getSchema('EventManagementv6');

	// @ts-ignore
	const moveFromOneToOther = <T>(mapFunc: (inObj: T) => T | PromiseLike<T> = identity) => async (
		from: Collection<T>,
		to: Collection<T>
	) => {
		await to.remove('true').execute();

		let count = 0;

		for await (const item of generateResults(from.find('true'))) {
			await to.add(await mapFunc(item as T)).execute();

			count++;
		}

		return count;
	};

	// @ts-ignore
	const mapFromOneToOther = <T, U>(mapFunc: (inObj: T) => U | PromiseLike<U>) => async (
		from: Collection<T>,
		to: Collection<U>
	) => {
		await to.remove('true').execute();

		let count = 0;

		for await (const item of generateResults(from.find('true'))) {
			await to.add(await mapFunc(item as T)).execute();

			count++;
		}

		return count;
	};

	const v5teamsCollection = v5schema.getCollection<RawTeamObject>('Teams');
	const v6teamsCollection = v6schema.getCollection<RawTeamObject>('Teams');

	const refToMaybe = (
		mem: MemberReference | { type: 'Null' } | MaybeObj<MemberReference>
	): MaybeObj<MemberReference> =>
		'hasValue' in mem ? mem : mem.type === 'Null' ? Maybe.none() : Maybe.some(mem);

	console.log('Moving teams...');
	console.log(
		await moveFromOneToOther<RawTeamObject>((team) => ({
			...team,
			cadetLeader: refToMaybe(team.cadetLeader),
			seniorCoach: refToMaybe(team.seniorCoach),
			seniorMentor: refToMaybe(team.seniorMentor),
		}))(v5teamsCollection, v6teamsCollection),
		'records moved'
	);
	console.log('Moved teams.\n');

	const v5eventsCollection = v5schema.getCollection<RawEventObject>('Events');
	const v6eventsCollection = v6schema.getCollection<RawEventObject>('Events');

	const correctPOC = (
		poc:
			| InternalPointOfContact
			| ExternalPointOfContact
			| (Omit<InternalPointOfContact, 'memberReference'> & { member: MemberReference })
	): InternalPointOfContact | ExternalPointOfContact =>
		poc.type === PointOfContactType.EXTERNAL
			? poc
			: 'member' in poc
			? {
					...(stripProp('member')(poc) as Omit<
						InternalPointOfContact,
						'memberReference'
					>),
					memberReference: poc.member,
			  }
			: poc;

	console.log('Moving events...');
	console.log(
		await moveFromOneToOther<RawEventObject>((event) => ({
			...event,
			pointsOfContact: event.pointsOfContact.map(correctPOC),
		}))(v5eventsCollection, v6eventsCollection),
		'records moved'
	);
	console.log('Moved events.\n');

	const v5accountsCollection = v5schema.getCollection<V5RawAccountObject>('Accounts');
	const v6accountsCollection = v6schema.getCollection<AccountObject>('Accounts');

	console.log('Moving Accounts...');
	console.log(
		await mapFromOneToOther<V5RawAccountObject, AccountObject>((account) => {
			switch (account.type) {
				case V5AccountType.CAPEVENT:
					return {
						aliases: account.aliases,
						comments: account.comments,
						discordServer: account.discordServer,
						id: account.id,
						mainCalendarID: account.mainCalendarID,
						parent: Maybe.some('md001'),
						wingCalendarID: account.wingCalendarID,

						type: AccountType.CAPEVENT,
					};

				case V5AccountType.CAPGROUP:
					return {
						aliases: account.aliases,
						comments: account.comments,
						discordServer: account.discordServer,
						id: account.id,
						mainCalendarID: account.mainCalendarID,
						orgid: account.mainOrg,
						parent: Maybe.some('md001'),
						wingCalendarID: account.wingCalendarID,

						type: AccountType.CAPGROUP,
					};

				case V5AccountType.CAPREGION:
					throw new Error('Huh? (' + V5AccountType[account.type] + ')');

				case V5AccountType.CAPSQUADRON:
					return {
						aliases: account.aliases,
						comments: account.comments,
						discordServer: account.discordServer,
						id: account.id,
						mainCalendarID: account.mainCalendarID,
						mainOrg: account.mainOrg,
						orgIDs: account.orgIDs,
						parentGroup: ['md089', 'md052', 'md007'].includes(account.id)
							? Maybe.some('md043')
							: Maybe.none(),
						wingCalendarID: account.wingCalendarID,
						parentWing: Maybe.some('md001'),

						type: AccountType.CAPSQUADRON,
					};

				case V5AccountType.CAPWING:
					return {
						aliases: account.aliases,
						comments: account.comments,
						discordServer: account.discordServer,
						id: account.id,
						mainCalendarID: account.mainCalendarID,
						orgIDs: account.orgIDs,
						orgid: account.mainOrg,
						parent: Maybe.none(),
						wingCalendarID: account.wingCalendarID,

						type: AccountType.CAPWING,
					};
			}
		})(v5accountsCollection, v6accountsCollection),
		'records moved'
	);
	console.log('Moved accounts.\n');

	const v5attendanceCollection = v5schema.getCollection<RawAttendanceRecord<V5AttendanceRecord>>(
		'Attendance'
	);
	const v6attendanceCollection = v6schema.getCollection<RawAttendanceRecord<AttendanceRecord>>(
		'Attendance'
	);

	console.log('Moving attendance...');
	console.log(
		await mapFromOneToOther<
			RawAttendanceRecord<V5AttendanceRecord>,
			RawAttendanceRecord<AttendanceRecord>
		>((record) => ({
			accountID: record.accountID,
			comments: record.comments,
			customAttendanceFieldValues: record.customAttendanceFieldValues,
			eventID: record.eventID,
			memberID: record.memberID,
			memberName: record.memberName,
			planToUseCAPTransportation: record.planToUseCAPTransportation,
			shiftTime: {
				arrivalTime: record.arrivalTime,
				departureTime: record.departureTime,
			},
			status: record.status,
			summaryEmailSent: record.summaryEmailSent,
			timestamp: record.timestamp,
		}))(v5attendanceCollection, v6attendanceCollection),
		'records moved'
	);
	console.log('Moved attendance.\n');

	const v5permissionsCollection = v5schema.getCollection<V5StoredMemberPermissions>(
		'UserPermissions'
	);
	const v6permissionsCollection = v6schema.getCollection<StoredMemberPermissions>(
		'UserPermissions'
	);

	const getEventPermissions = (permissions: V5MemberPermissions): CAPEventMemberPermissions => ({
		type: AccountType.CAPEVENT,

		AdministerPT: permissions.AdministerPT,
		AssignTasks: permissions.AssignTasks,
		AssignTemporaryDutyPositions: permissions.AssignTemporaryDutyPositions,
		AttendanceView: permissions.AttendanceView,
		CreateNotifications: permissions.CreateNotifications,
		EventContactSheet: permissions.EventContactSheet,
		EventLinkList: permissions.EventLinkList,
		FileManagement: permissions.FileManagement,
		FlightAssign: permissions.FlightAssign,
		ManageEvent: permissions.ManageEvent,
		ManageTeam: permissions.ManageTeam,
		MusterSheet: permissions.MusterSheet,
		ORMOPORD: permissions.ORMOPORD,
		PermissionManagement: permissions.PermissionManagement,
		RegistryEdit: permissions.RegistryEdit,
		ScanAdd: permissions.ScanAdd,
		ViewAccountNotifications:
			permissions.ViewAccountNotifications ?? Permissions.ViewAccountNotifications.NO,
	});

	const getSquadronPermissions = (
		permissions: V5MemberPermissions
	): CAPSquadronMemberPermissions => ({
		type: AccountType.CAPSQUADRON,

		...permissions,
		ViewAccountNotifications:
			permissions.ViewAccountNotifications ?? Permissions.ViewAccountNotifications.NO,
	});

	const getGroupPermissions = (permissions: V5MemberPermissions): CAPGroupMemberPermissions => ({
		type: AccountType.CAPGROUP,

		AssignTasks: permissions.AssignTasks,
		AssignTemporaryDutyPositions: permissions.AssignTemporaryDutyPositions,
		AttendanceView: permissions.AttendanceView,
		CreateNotifications: permissions.CreateNotifications,
		EventContactSheet: permissions.EventContactSheet,
		EventLinkList: permissions.EventLinkList,
		FileManagement: permissions.FileManagement,
		ManageEvent: permissions.ManageEvent,
		ManageTeam: permissions.ManageTeam,
		ORMOPORD: permissions.ORMOPORD,
		PermissionManagement: permissions.PermissionManagement,
		RegistryEdit: permissions.RegistryEdit,
		ScanAdd: permissions.ScanAdd,
		ViewAccountNotifications:
			permissions.ViewAccountNotifications ?? Permissions.ViewAccountNotifications.NO,
	});

	const getWingPermissions = (permissions: V5MemberPermissions): CAPWingMemberPermissions => ({
		type: AccountType.CAPWING,

		AssignTasks: permissions.AssignTasks,
		AssignTemporaryDutyPositions: permissions.AssignTemporaryDutyPositions,
		AttendanceView: permissions.AttendanceView,
		CreateEventAccount: Permissions.CreateEventAccount.NO,
		CreateNotifications: permissions.CreateNotifications,
		EventContactSheet: permissions.EventContactSheet,
		EventLinkList: permissions.EventLinkList,
		FileManagement: permissions.FileManagement,
		ManageEvent: permissions.ManageEvent,
		ManageTeam: permissions.ManageTeam,
		ORMOPORD: permissions.ORMOPORD,
		PermissionManagement: permissions.PermissionManagement,
		RegistryEdit: permissions.RegistryEdit,
		ScanAdd: permissions.ScanAdd,
		ViewAccountNotifications:
			permissions.ViewAccountNotifications ?? Permissions.ViewAccountNotifications.NO,
	});

	const getRegionPermissions = (
		permissions: V5MemberPermissions
	): CAPRegionMemberPermissions => ({
		type: AccountType.CAPREGION,

		AssignTasks: permissions.AssignTasks,
		AssignTemporaryDutyPositions: permissions.AssignTemporaryDutyPositions,
		AttendanceView: permissions.AttendanceView,
		CreateEventAccount: Permissions.CreateEventAccount.NO,
		CreateNotifications: permissions.CreateNotifications,
		EventContactSheet: permissions.EventContactSheet,
		EventLinkList: permissions.EventLinkList,
		FileManagement: permissions.FileManagement,
		ManageEvent: permissions.ManageEvent,
		ManageTeam: permissions.ManageTeam,
		ORMOPORD: permissions.ORMOPORD,
		PermissionManagement: permissions.PermissionManagement,
		RegistryEdit: permissions.RegistryEdit,
		ScanAdd: permissions.ScanAdd,
		ViewAccountNotifications:
			permissions.ViewAccountNotifications ?? Permissions.ViewAccountNotifications.NO,
	});

	const getPermissions = (accountType: AccountType) => (permissions: V5MemberPermissions) =>
		accountType === AccountType.CAPEVENT
			? getEventPermissions(permissions)
			: accountType === AccountType.CAPSQUADRON
			? getSquadronPermissions(permissions)
			: accountType === AccountType.CAPGROUP
			? getGroupPermissions(permissions)
			: accountType === AccountType.CAPWING
			? getWingPermissions(permissions)
			: getRegionPermissions(permissions);

	console.log('Moving UserPermissions...');
	console.log(
		await mapFromOneToOther<V5StoredMemberPermissions, StoredMemberPermissions>(
			({ permissions, accountID, member }) =>
				getAccount(v6schema)(accountID)
					.map<StoredMemberPermissions>(({ type }) => ({
						type,
						permissions: getPermissions(type)(permissions),
						member,
						accountID,
					}))
					.leftMap(
						(err) =>
							err.type === 'OTHER' && err.code === 404
								? {
										code: 404,
										type: 'OTHER' as const,
										message: `Could not find account: ${accountID}`,
								  }
								: err,
						errorGenerator('Could not get account info')
					)
					.fullJoin()
		)(v5permissionsCollection, v6permissionsCollection),
		'records moved'
	);
	console.log('Moved UserPermissions.\n');

	const move = async (table: string) => {
		console.log(`Moving ${table}...`);
		await moveFromOneToOther(identity)(
			v5schema.getCollection(table),
			v6schema.getCollection(table)
		);
		console.log(`Moved ${table}.\n`);
	};
	await move('DiscordAccounts');
	// await move('ExtraAccountMembership');
	await move('ExtraMemberInformation');
	await move('Files');
	await move('MemberSessions');
	await move('NHQ_CadetActivities');
	await move('NHQ_CadetDutyPosition');
	await move('NHQ_DutyPosition');
	await move('NHQ_MbrContact');
	await move('NHQ_Member');
	await move('NHQ_OFlight');
	await move('NHQ_Organization');
	await move('Notifications');
	await move('PasswordResetTokens');
	await move('ProspectiveMembers');
	await move('Registry');
	await move('Tasks');
	await move('Teams');
	await move('UserAccountInfo');

	await Promise.all([v5session.close(), v6session.close()]);

	process.exit();
})();
