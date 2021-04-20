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

import { Collection, CollectionFind, Schema } from '@mysql/xdevapi';
import { ServerEither } from 'auto-client-api';
import {
	AccountObject,
	AccountType,
	addOne,
	AllAudits,
	areMembersTheSame,
	AsyncEither,
	asyncIterReduce,
	asyncLeft,
	asyncRight,
	CAPAccountObject,
	CAPExtraMemberInformation,
	CAPNHQMemberObject,
	CAPNHQMemberReference,
	CAPProspectiveMemberObject,
	CAPProspectiveMemberReference,
	destroy,
	DiscordAccount,
	errorGenerator,
	EventType,
	FromDatabase,
	get,
	getFullMemberName,
	getMemberEmail,
	getMemberName,
	getMemberPhone,
	getUserID,
	isPartOfTeam,
	isRegularCAPAccountObject,
	Maybe,
	NewCAPProspectiveMember,
	NotificationCause,
	NotificationCauseType,
	NotificationData,
	NotificationMemberCause,
	NotificationMemberTarget,
	NotificationTarget,
	NotificationTargetType,
	PointOfContactType,
	RawAttendanceDBRecord,
	RawCAPEventAccountObject,
	RawCAPProspectiveMemberObject,
	RawCAPSquadronAccountObject,
	RawEventObject,
	RawFileObject,
	RawNotificationObject,
	ServerError,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
	SignInLogData,
	StoredMemberPermissions,
	StoredMFASecret,
	StoredProspectiveMemberObject,
	stripProp,
	TableNames,
	TaskObject,
	toReference,
	UserAccountInformation,
} from 'common-lib';
import { loadExtraCAPMemberInformation } from '.';
import { AccountBackend } from '../../..';
import { Backends } from '../../../backends';
import { MemberBackend } from '../../../Members';
import {
	addToCollection,
	collectResults,
	deleteFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	RawMySQLBackend,
} from '../../../MySQLUtil';
import { getRegistry } from '../../../Registry';
import { getEmptyTeamsBackend, TeamsBackend } from '../../../Team';
import { getNameForCAPNHQMember, getNHQMember } from './NHQMember';

const getRowsForProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	reference: CAPProspectiveMemberReference,
): AsyncEither<ServerError, StoredProspectiveMemberObject> =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not get member information'),
	)
		.map(
			findAndBindC<StoredProspectiveMemberObject>({
				id: reference.id,
				accountID: account.id,
			}),
		)
		.map(collectResults)
		.filter(results => results.length === 1, {
			message: 'Could not find member',
			code: 404,
			type: 'OTHER',
		})
		.map(get(0))
		.map(obj => stripProp('_id')(obj) as StoredProspectiveMemberObject);

export const getProspectiveMembersForAccount = (schema: Schema) => (
	backend: Backends<[TeamsBackend]>,
) => (account: RawCAPSquadronAccountObject) =>
	AsyncEither.All([
		getRegistry(schema)(account),
		asyncRight(
			collectResults(
				findAndBind(
					schema.getCollection<RawCAPProspectiveMemberObject>('ProspectiveMembers'),
					{
						accountID: account.id,
						hasNHQReference: false,
					},
				),
			),
			errorGenerator('Could not get prospective members for account'),
		),
		asyncRight(
			collectResults(
				findAndBind(
					schema.getCollection<CAPExtraMemberInformation>('ExtraMemberInformation'),
					{
						accountID: account.id,
					},
				),
			),
			errorGenerator('Could not load prospective members for account'),
		),
		backend.getTeams(account),
	]).map(([registry, members, orgExtraInfo, teamObjects]) =>
		members.map(member => {
			const memberID = toReference(member);
			const finder = areMembersTheSame(member);

			const extraInfo =
				orgExtraInfo.find(({ member: id }) => finder(id)) ??
				({
					accountID: account.id,
					member: memberID,
					temporaryDutyPositions: [],
					flight: null,
					teamIDs: teamObjects.filter(isPartOfTeam(memberID)).map(({ id }) => id),
					absentee: null,
					type: 'CAP',
				} as CAPExtraMemberInformation);

			return {
				absenteeInformation: extraInfo.absentee,
				contact: member.contact,
				dutyPositions: extraInfo.temporaryDutyPositions.map(
					item =>
						({
							date: item.assigned,
							duty: item.Duty,
							expires: item.validUntil,
							type: 'CAPUnit',
						} as ShortDutyPosition),
				),
				flight: extraInfo.flight,
				id: member.id,
				memberRank: member.memberRank,
				nameFirst: member.nameFirst,
				nameLast: member.nameLast,
				nameMiddle: member.nameMiddle,
				nameSuffix: member.nameSuffix,
				hasNHQReference: false as const,
				seniorMember: member.seniorMember,
				squadron: registry.Website.Name,
				type: 'CAPProspectiveMember' as const,
				orgid: account.mainOrg,
				accountID: account.id,
				usrID: member.usrID,
				teamIDs: extraInfo.teamIDs,
			};
		}),
	);

export const expandProspectiveMember = (schema: Schema) => (backends: Backends<[TeamsBackend]>) => (
	account: Exclude<CAPAccountObject, RawCAPEventAccountObject>,
) => (info: RawCAPProspectiveMemberObject) =>
	getRegistry(schema)(account).flatMap(registry =>
		asyncRight(info.id, errorGenerator('Could not get member information'))
			.flatMap(id =>
				AsyncEither.All([
					loadExtraCAPMemberInformation(schema)(backends)(account)({
						id,
						type: 'CAPProspectiveMember',
					}),
				]),
			)
			.map<CAPProspectiveMemberObject>(([extraInformation]) => ({
				absenteeInformation: extraInformation.absentee,
				contact: info.contact,
				dutyPositions: extraInformation.temporaryDutyPositions.map(
					item =>
						({
							date: item.assigned,
							duty: item.Duty,
							expires: item.validUntil,
							type: 'CAPUnit',
						} as ShortDutyPosition),
				),
				flight: extraInformation.flight,
				id: info.id,
				memberRank: info.memberRank,
				nameFirst: info.nameFirst,
				nameLast: info.nameLast,
				nameMiddle: info.nameMiddle,
				nameSuffix: info.nameSuffix,
				hasNHQReference: false,
				seniorMember: info.seniorMember,
				squadron: registry.Website.Name,
				type: 'CAPProspectiveMember',
				orgid: account.type === AccountType.CAPSQUADRON ? account.mainOrg : account.orgid,
				accountID: account.id,
				usrID: info.usrID,
				teamIDs: extraInformation.teamIDs,
			})),
	);

export const getProspectiveMember = (schema: Schema) => (backends: Backends<[TeamsBackend]>) => (
	account: AccountObject,
) => (
	prospectiveID: string,
): AsyncEither<ServerError, CAPProspectiveMemberObject | CAPNHQMemberObject> =>
	getRegistry(schema)(account).flatMap(registry =>
		isRegularCAPAccountObject(account)
			? asyncRight(prospectiveID, errorGenerator('Could not get member information'))
					.flatMap(id =>
						AsyncEither.All([
							getRowsForProspectiveMember(schema)(account)({
								type: 'CAPProspectiveMember',
								id,
							}),
							loadExtraCAPMemberInformation(schema)(backends)(account)({
								id,
								type: 'CAPProspectiveMember',
							}),
						]),
					)
					.flatMap<CAPProspectiveMemberObject | CAPNHQMemberObject>(
						([info, extraInformation]) =>
							info.hasNHQReference
								? getNHQMember(schema)(backends)(account)(info.nhqReference.id)
								: asyncRight(
										{
											absenteeInformation: extraInformation.absentee,
											contact: info.contact,
											dutyPositions: [
												...extraInformation.temporaryDutyPositions.map(
													item =>
														({
															date: item.assigned,
															duty: item.Duty,
															expires: item.validUntil,
															type: 'CAPUnit',
														} as ShortDutyPosition),
												),
											],
											flight: extraInformation.flight,
											id: info.id,
											memberRank: info.memberRank,
											nameFirst: info.nameFirst,
											nameLast: info.nameLast,
											nameMiddle: info.nameMiddle,
											nameSuffix: info.nameSuffix,
											seniorMember: info.seniorMember,
											hasNHQReference: false,
											squadron: registry.Website.Name,
											type: 'CAPProspectiveMember',
											orgid:
												account.type === AccountType.CAPSQUADRON
													? account.mainOrg
													: account.orgid,
											accountID: account.id,
											usrID: info.usrID,
											teamIDs: extraInformation.teamIDs,
										},
										errorGenerator(
											'Could not get prospective member information',
										),
								  ),
					)
			: asyncLeft({
					type: 'OTHER',
					code: 400,
					message: 'Cannot create a prospective member for a CAP Event account',
			  }),
	);

export const getExtraInformationFromProspectiveMember = (account: AccountObject) => (
	member: CAPProspectiveMemberObject,
): CAPExtraMemberInformation => ({
	absentee: member.absenteeInformation,
	accountID: account.id,
	flight: member.flight,
	member: {
		type: 'CAPProspectiveMember',
		id: member.id,
	},
	teamIDs: [],
	temporaryDutyPositions: member.dutyPositions
		.filter((v): v is ShortCAPUnitDutyPosition => v.type === 'CAPUnit')
		.map(({ date, duty, expires }) => ({
			Duty: duty,
			assigned: date,
			validUntil: expires,
		})),
});

export const getNameForCAPProspectiveMember = (schema: Schema) => (account: AccountObject) => (
	reference: CAPProspectiveMemberReference,
): AsyncEither<ServerError, string> =>
	getRowsForProspectiveMember(schema)(account)(reference).flatMap(result =>
		result.hasNHQReference
			? getNameForCAPNHQMember(schema)(result.nhqReference)
			: asyncRight(
					`${result.memberRank} ${getMemberName({
						nameFirst: result.nameFirst,
						nameMiddle: result.nameMiddle,
						nameLast: result.nameLast,
						nameSuffix: result.nameSuffix,
					})}`,
					errorGenerator('Could not get prospective member name'),
			  ),
	);

export const createCAPProspectiveMember = (schema: Schema) => (
	account: RawCAPSquadronAccountObject,
) => (data: NewCAPProspectiveMember): AsyncEither<ServerError, CAPProspectiveMemberObject> =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not create member'),
	).flatMap(collection =>
		asyncRight(
			findAndBindC<StoredProspectiveMemberObject>({
				accountID: account.id,
			})(collection),
			errorGenerator('Could not get member ID'),
		)
			.map(generateResults)
			.map(
				asyncIterReduce((prev: number, curr: StoredProspectiveMemberObject) =>
					Math.max(prev, parseInt(curr.id.split('-')[1], 10)),
				)(1),
			)
			.map(addOne)
			.map(id => `${account.id}-${id}`)
			.flatMap(id =>
				getRegistry(schema)(account).map<RawCAPProspectiveMemberObject>(registry => ({
					...data,
					id,
					absenteeInformation: null,
					accountID: account.id,
					dutyPositions: [],
					hasNHQReference: false,
					memberRank: data.seniorMember ? 'SM' : 'CADET',
					orgid: account.mainOrg,
					squadron: registry.Website.Name,
					type: 'CAPProspectiveMember',
					usrID: getUserID([data.nameFirst, data.nameMiddle, data.nameLast]),
				})),
			)
			.flatMap(
				addToCollection(
					schema.getCollection<RawCAPProspectiveMemberObject>('ProspectiveMembers'),
				),
			)
			.flatMap(
				expandProspectiveMember(schema)({
					...getEmptyTeamsBackend(),
					getTeams: () => asyncRight([], errorGenerator('wut?')),
				})(account),
			),
	);

export const getProspectiveMemberAccounts = (backend: Backends<[AccountBackend]>) => (
	member: CAPProspectiveMemberObject,
): ServerEither<CAPAccountObject[]> =>
	backend.getAccount(member.accountID).map(account => [account]);

export const deleteProspectiveMember = (schema: Schema) => (member: CAPProspectiveMemberObject) =>
	asyncRight(
		schema.getCollection<StoredProspectiveMemberObject>('ProspectiveMembers'),
		errorGenerator('Could not delete prospective member'),
	).flatMap(deleteFromCollectionA(member));

const getAllRecords = <T>(
	collection: Collection<FromDatabase<T>>,
): CollectionFind<FromDatabase<T>> => collection.find('true');

const updateCollection = <T>(
	recordUpdater: (
		prev: T,
		member: CAPNHQMemberObject,
		prevMember: CAPProspectiveMemberReference,
	) => T,
	generateFind: (
		collection: Collection<FromDatabase<T>>,
		prevMember: CAPProspectiveMemberReference,
	) => CollectionFind<FromDatabase<T>> = getAllRecords,
) => (prevMember: CAPProspectiveMemberReference, member: CAPNHQMemberObject) => (
	collection: Collection<FromDatabase<T>>,
) => {
	const generator = generateResults(generateFind(collection, prevMember));

	return asyncRight(
		(async () => {
			const promises = [];

			for await (const record of generator) {
				const updatedRecord = recordUpdater(record as T, member, prevMember);

				promises.push(collection.replaceOne(record._id!, updatedRecord as FromDatabase<T>));
			}

			await Promise.all(promises);
		})(),
		errorGenerator('Could not upgrade member information'),
	);
};

const attendanceUpdater = updateCollection<RawAttendanceDBRecord>(
	(record, member) => ({
		...record,
		memberID: toReference(member),
		memberName: getFullMemberName(member),
	}),
	(collection, memberID) => findAndBind(collection, { memberID }),
);

const auditsUpdater = updateCollection<AllAudits>(
	(record, member) => ({
		...record,
		actor: toReference(member),
		actorName: getFullMemberName(member),
	}),
	(collection, actor) => findAndBind(collection, { actor }),
);

const discordAccountUpdater = updateCollection<DiscordAccount>(
	(record, member) => ({
		...record,
		member: toReference(member),
	}),
	(collection, member) => findAndBind(collection, { member }),
);

const eventsUpdater = updateCollection<RawEventObject>((record, member, prevMember) =>
	record.type === EventType.LINKED
		? {
				...record,
				linkAuthor: areMembersTheSame(prevMember)(record.linkAuthor)
					? toReference(member)
					: record.linkAuthor,
		  }
		: {
				...record,
				author: areMembersTheSame(prevMember)(record.author)
					? toReference(member)
					: record.author,
				pointsOfContact: record.pointsOfContact.map(poc =>
					poc.type === PointOfContactType.INTERNAL &&
					areMembersTheSame(prevMember)(poc.memberReference)
						? {
								...poc,
								memberReference: toReference(member),
								name: getFullMemberName(member),
								email: Maybe.orSome('')(getMemberEmail(member.contact)),
								phone: Maybe.orSome('')(getMemberPhone(member.contact)),
						  }
						: poc,
				),
		  },
);

const extraAccountMembershipUpdater = updateCollection<CAPExtraMemberInformation>(
	(record, member) => ({
		...record,
		member: toReference(member),
	}),
	(collection, member) => findAndBind(collection, { member }),
);

const filesUpdater = updateCollection<RawFileObject>(
	(record, member) => ({
		...record,
		owner: toReference(member),
	}),
	(collection, owner) => findAndBind(collection, { owner }),
);

const mfaTokensUpdater = updateCollection<StoredMFASecret>(
	(record, member) => ({
		...record,
		member: toReference(member),
	}),
	(collection, member) => findAndBind(collection, { member }),
);

const receivedNotificationsUpdater = updateCollection<
	RawNotificationObject<NotificationCause, NotificationMemberTarget, NotificationData>
>(
	(record, member) => ({
		...record,
		target: {
			type: NotificationTargetType.MEMBER,
			to: toReference(member),
		},
	}),
	(collection, to) =>
		findAndBind(collection, { target: { type: NotificationTargetType.MEMBER, to } }),
);

const sentNotificationUpdater = updateCollection<
	RawNotificationObject<NotificationMemberCause, NotificationTarget, NotificationData>
>(
	(record, member) => ({
		...record,
		cause: {
			from: toReference(member),
			fromName: getFullMemberName(member),
			type: NotificationCauseType.MEMBER,
		},
	}),
	(collection, from) =>
		findAndBind(collection, {
			cause: { from, type: NotificationCauseType.MEMBER } as NotificationMemberCause,
		}),
);

const signInLogUpdater = updateCollection<SignInLogData>(
	(record, member) => ({
		...record,
		memberRef: toReference(member),
	}),
	(collection, memberRef) => findAndBind(collection, { memberRef }),
);

const tasksSentUpdater = updateCollection<TaskObject>(
	(record, member) => ({
		...record,
		tasker: toReference(member),
	}),
	(collection, tasker) => findAndBind(collection, { tasker }),
);

const tasksReceivedUpdater = updateCollection<TaskObject>((record, member, prevMember) => ({
	...record,
	results: record.results.map(result =>
		areMembersTheSame(prevMember)(result.tasked)
			? { ...result, tasked: toReference(member) }
			: result,
	),
}));

const userAccountInfoUpdater = updateCollection<UserAccountInformation>(
	(record, member) => ({
		...record,
		member: toReference(member),
	}),
	(collection, member) => findAndBind(collection, { member }),
);

const userPermissionsUpdater = updateCollection<StoredMemberPermissions>(
	(record, member) => ({
		...record,
		member: toReference(member),
	}),
	(collection, member) => findAndBind(collection, { member }),
);

const updateFunctions = [
	[attendanceUpdater, 'Attendance'],
	[auditsUpdater, 'Audits'],
	[discordAccountUpdater, 'DiscordAccounts'],
	[eventsUpdater, 'Events'],
	[extraAccountMembershipUpdater, 'ExtraAccountMembership'],
	[filesUpdater, 'Files'],
	[mfaTokensUpdater, 'MFATokens'],
	[receivedNotificationsUpdater, 'Notifications'],
	[sentNotificationUpdater, 'Notifications'],
	[signInLogUpdater, 'SignInLog'],
	[tasksSentUpdater, 'Tasks'],
	[tasksReceivedUpdater, 'Tasks'],
	[userAccountInfoUpdater, 'UserAccountInfo'],
	[userPermissionsUpdater, 'UserPermissions'],
] as [
	(
		prevMember: CAPProspectiveMemberObject,
		member: CAPNHQMemberObject,
	) => (collection: Collection) => ServerEither<void>,
	TableNames,
][];

export const upgradeProspectiveMemberToCAPNHQ = (
	backend: Backends<[RawMySQLBackend, AccountBackend, MemberBackend]>,
) => (member: CAPProspectiveMemberObject) => (nhqReference: CAPNHQMemberReference) =>
	AsyncEither.All([
		asyncRight(
			backend.getCollection('ProspectiveMembers'),
			errorGenerator('Could not delete prospective member'),
		).flatMap(deleteFromCollectionA(member)),
		backend
			.getAccount(member.accountID)
			.flatMap(account => backend.getMember(account)(nhqReference))
			.flatMap(newMember =>
				AsyncEither.All(
					updateFunctions.map(([func, tableName]) =>
						func(member, newMember)(backend.getCollection(tableName)),
					),
				),
			),
	]).map(destroy);
