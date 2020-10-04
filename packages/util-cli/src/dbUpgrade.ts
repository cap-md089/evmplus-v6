#!/usr/bin/env node
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

import { Collection, getSession } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	AccountObject,
	AccountType,
	CAPWingMemberPermissions,
	CustomAttendanceField,
	CustomAttendanceFieldValue,
	Either,
	EventStatus,
	EventType,
	ExternalPointOfContact,
	FileControlListItem,
	InternalPointOfContact,
	Permissions,
	RawEventObject,
	RawFileObject,
	RawLinkedEvent,
	RawRegularEventObject,
	RawServerConfiguration,
	RawTeamObject,
	StoredMemberPermissions,
	Validator,
} from 'common-lib';
import 'dotenv/config';
import { confFromRaw, generateResults, RawAttendanceDBRecord } from 'server-common';

const EventStatusMap = {
	0: 'Draft',
	1: 'Tentative',
	2: 'Confirmed',
	3: 'Complete',
	4: 'Cancelled',
	5: 'InformationOnly',
};

const PointOfContactTypeMap = {
	0: 'Internal',
	1: 'External',
};

const TeamPublicityMap = {
	0: 'Private',
	1: 'Protected',
	2: 'Public',
};

const AttendanceStatusMap = {
	0: 'CommittedAttended',
	1: 'NoShow',
	2: 'RescindedCommitmentToAttend',
	3: 'NotPlanningToAttend',
};

const FileUserAccessControlTypeMap = {
	0: 'User',
	1: 'Team',
	2: 'AccountMember',
	3: 'SignedIn',
	4: 'Other',
};

const CustomAttendanceFieldEntryTypeMap = {
	0: 'Text',
	1: 'Number',
	2: 'Date',
	3: 'Checkbox',
	4: 'File',
};

const FullOrNonePermissionsMap = {
	0: 'None',
	1: 'Full',
};

const BasicPermissionMap = {
	0: 'Yes',
	1: 'No',
};

const ManageEventMap = {
	0: 'None',
	1: 'AddDraftEvents',
	2: 'Full',
};

const NotifyPermissionMap = {
	0: 'No',
	1: 'Global',
};

const AttendanceViewPermissionMap = {
	0: 'Personal',
	1: 'Other',
};

const AccountTypeMap = {
	1: 'CAPSquadron',
	2: 'CAPGroup',
	3: 'CAPWing',
	4: 'CAPRegion',
	5: 'CAPEvent',
};

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

process.on('unhandledRejection', up => {
	throw up;
});

(async () => {
	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	const schema = session.getSchema(conf.DB_SCHEMA);

	// @ts-ignore
	const upgradeTable = async <T>(
		table: Collection<T>,
		map: (prev: { [p in keyof T]: any }) => PromiseLike<T> | T,
	) => {
		const foundIDs = new Map<string, boolean>();

		for await (const obj of generateResults(table.find('true'))) {
			if (foundIDs.has(obj._id!)) {
				continue;
			}

			await table.removeOne(obj._id!);

			const result = await table.add(await map(obj)).execute();
			const [newID] = result.getGeneratedIds();
			foundIDs.set(newID, true);
		}

		return foundIDs.size;
	};

	await session.startTransaction();

	const fixRawRegularEventObject = (ev: RawRegularEventObject): RawRegularEventObject => ({
		...ev,
		type: EventType.REGULAR,
		status: (EventStatusMap[
			(ev.status as unknown) as keyof typeof EventStatusMap
		] as unknown) as EventStatus,
		pointsOfContact: ev.pointsOfContact.map(
			poc =>
				(({
					...poc,
					type: PointOfContactTypeMap[(poc.type as unknown) as 0 | 1],
				} as unknown) as InternalPointOfContact | ExternalPointOfContact),
		),
		customAttendanceFields: ev.customAttendanceFields.map(
			field =>
				(({
					...field,
					type:
						CustomAttendanceFieldEntryTypeMap[
							(field.type as unknown) as 0 | 1 | 2 | 3 | 4
						],
				} as unknown) as CustomAttendanceField),
		),
	});

	const updateCommonPerms = (perms: any) => ({
		AssignTasks: (BasicPermissionMap[
			perms.AssignTasks as 0
		] as unknown) as Permissions.AssignTasks,
		ManageEvent: (ManageEventMap[perms.ManageEvent as 0] as unknown) as Permissions.ManageEvent,
		EventContactSheet: (BasicPermissionMap[
			perms.EventContactSheet as 0
		] as unknown) as Permissions.EventContactSheet,
		ORMOPORD: (BasicPermissionMap[perms.ORMOPORD as 0] as unknown) as Permissions.ORMOPORD,
		AssignTemporaryDutyPositions: (BasicPermissionMap[
			perms.AssignTemporaryDutyPositions as 0
		] as unknown) as Permissions.AssignTemporaryDutyPosition,
		EventLinkList: (BasicPermissionMap[
			perms.EventLinkList as 0
		] as unknown) as Permissions.EventLinkList,
		ManageTeam: (FullOrNonePermissionsMap[
			perms.ManageTeam as 0
		] as unknown) as Permissions.ManageTeam,
		FileManagement: (FullOrNonePermissionsMap[
			perms.FileManagement as 0
		] as unknown) as Permissions.FileManagement,
		ScanAdd: (BasicPermissionMap[perms.ScanAdd as 0] as unknown) as Permissions.ScanAdd,
		AttendanceView: (AttendanceViewPermissionMap[
			perms.AttendanceView as 0
		] as unknown) as Permissions.AttendanceView,
		PermissionManagement: (FullOrNonePermissionsMap[
			perms.PermissionManagement as 0
		] as unknown) as Permissions.PermissionManagement,
		CreateNotifications: (NotifyPermissionMap[
			perms.CreateNotifications as 0
		] as unknown) as Permissions.Notify,
		RegistryEdit: (BasicPermissionMap[
			perms.RegistryEdit as 0
		] as unknown) as Permissions.RegistryEdit,
		ViewAccountNotifications: (BasicPermissionMap[
			perms.ViewAccountNotifications as 0
		] as unknown) as Permissions.ViewAccountNotifications,
	});

	try {
		await Promise.all([
			upgradeTable(schema.getCollection<RawEventObject>('Events'), ev =>
				ev.type === ((2 as unknown) as EventType.LINKED) || ev.type === EventType.LINKED
					? {
							...(ev as RawLinkedEvent),
							type: EventType.LINKED as const,
					  }
					: fixRawRegularEventObject(ev as RawRegularEventObject),
			),
			upgradeTable(
				schema.getCollection<RawAttendanceDBRecord>('Attendance'),
				rec =>
					(({
						...rec,
						status: AttendanceStatusMap[(rec.status as unknown) as 0 | 1 | 2 | 3],
						customAttendanceFieldValues: rec.customAttendanceFieldValues.map(
							(fieldValue: CustomAttendanceFieldValue) => ({
								...fieldValue,
								type:
									CustomAttendanceFieldEntryTypeMap[
										(fieldValue.type as unknown) as 0 | 1 | 2 | 3 | 4
									],
							}),
						),
					} as unknown) as RawAttendanceDBRecord),
			),
			upgradeTable(
				schema.getCollection<RawTeamObject>('Teams'),
				team =>
					(({
						...team,
						visibility: TeamPublicityMap[(team.visibility as unknown) as 0 | 1 | 2],
					} as unknown) as RawTeamObject),
			),
			upgradeTable(
				schema.getCollection<RawFileObject>('Files'),
				file =>
					(({
						...file,
						permissions: file.permissions.map((perm: FileControlListItem) => ({
							...perm,
							type:
								FileUserAccessControlTypeMap[
									(perm.type as unknown) as 0 | 1 | 2 | 3 | 4
								],
						})),
					} as unknown) as RawFileObject),
			),
			upgradeTable(
				schema.getCollection<AccountObject>('Accounts'),
				account =>
					(({
						...account,
						type: AccountTypeMap[(account.type as unknown) as 1],
					} as unknown) as AccountObject),
			),
			upgradeTable(
				schema.getCollection<StoredMemberPermissions>('UserPermissions'),
				(perms: StoredMemberPermissions) =>
					perms.permissions.type === ((1 as unknown) as AccountType.CAPSQUADRON)
						? ({
								permissions: {
									type: AccountType.CAPSQUADRON as const,

									...updateCommonPerms(perms.permissions),

									FlightAssign: (BasicPermissionMap[
										(perms.permissions.FlightAssign as unknown) as 0
									] as unknown) as Permissions.FlightAssign,
									MusterSheet: (BasicPermissionMap[
										(perms.permissions.MusterSheet as unknown) as 0
									] as unknown) as Permissions.MusterSheet,
									AdministerPT: (BasicPermissionMap[
										(perms.permissions.AdministerPT as unknown) as 0
									] as unknown) as Permissions.AdministerPT,

									ProspectiveMemberManagement: (FullOrNonePermissionsMap[
										(perms.permissions
											.ProspectiveMemberManagement as unknown) as 0
									] as unknown) as Permissions.ProspectiveMemberManagement,
								},
								member: perms.member,
								accountID: perms.accountID,
						  } as StoredMemberPermissions)
						: perms.permissions.type === ((2 as unknown) as AccountType.CAPGROUP)
						? ({
								permissions: {
									type: AccountType.CAPGROUP as const,
									...updateCommonPerms(perms.permissions),
								},
								member: perms.member,
								accountID: perms.accountID,
						  } as StoredMemberPermissions)
						: perms.permissions.type === ((3 as unknown) as AccountType.CAPWING)
						? ({
								permissions: {
									type: AccountType.CAPWING as const,
									...updateCommonPerms(perms.permissions),
									CreateEventAccount: (BasicPermissionMap[
										(perms.permissions.CreateEventAccount as unknown) as 0
									] as unknown) as Permissions.CreateEventAccount,
								} as CAPWingMemberPermissions,
								member: perms.member,
								accountID: perms.accountID,
						  } as StoredMemberPermissions)
						: perms.permissions.type === ((4 as unknown) as AccountType.CAPREGION)
						? {
								permissions: {
									type: AccountType.CAPREGION as const,
									...updateCommonPerms(perms.permissions),
									CreateEventAccount: (BasicPermissionMap[
										(perms.permissions.CreateEventAccount as unknown) as 0
									] as unknown) as Permissions.CreateEventAccount,
								},
								member: perms.member,
								accountID: perms.accountID,
						  }
						: {
								permissions: {
									type: AccountType.CAPEVENT as const,
									...updateCommonPerms(perms.permissions),
									FlightAssign: (BasicPermissionMap[
										(perms.permissions.FlightAssign as unknown) as 0
									] as unknown) as Permissions.FlightAssign,
								},
								member: perms.member,
								accountID: perms.accountID,
						  },
			),
		]);

		await session.commit();
	} catch (e) {
		console.error(e);
		await session.rollback();
	}

	await session.close();

	process.exit();
})();
