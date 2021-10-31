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

import { Collection, Schema, WithoutEmpty } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterEitherFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	AttendanceRecord,
	call,
	canFullyManageEvent,
	canSignSomeoneElseUpForEvent,
	canSignUpForEvent,
	CustomAttendanceFieldValue,
	destroy,
	effectiveManageEventPermissionForEvent,
	Either,
	errorGenerator,
	EventObject,
	EventType,
	FromDatabase,
	get,
	getCustomAttendanceFieldForValue,
	getFullMemberName,
	hasBasicAttendanceManagementPermission,
	identity,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	memoize,
	NewAttendanceRecord,
	Permissions,
	pipe,
	RawEventObject,
	RawResolvedEventObject,
	stringifyMemberReference,
	toReference,
	User,
} from 'common-lib';
import { AccountBackend, BasicAccountRequest } from './Account';
import { Backends, notImplementedError, notImplementedException, TimeBackend } from './backends';
import { EventsBackend, getEventID, newEnsureResolvedEvent } from './Event';
import { MemberBackend } from './Members';
import {
	addToCollection,
	collectResults,
	findAndBindC,
	generateBindObject,
	generateFindStatement,
	generateResults,
	isDuplicateRecordError,
	modifyAndBindC,
	RawMySQLBackend,
	removeAndBindC,
} from './MySQLUtil';
import { ServerEither } from './servertypes';
import { TeamsBackend } from './Team';

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

// const attendanceRecordBelongsToAccount = (accountGetter: AccountGetter) => (schema: Schema) => (
// 	accountID: string,
// ) => (attendanceRecord: AttendanceRecord) =>
// 	accountGetter
// 		.byId(schema)(accountID)
// 		.flatMap(account =>
// 			resolveReference(schema)(account)(attendanceRecord.memberID).flatMap(member =>
// 				isMemberPartOfAccount(accountGetter)(schema)(member)(account),
// 			),
// 		);

const getAttendanceEventIdentifier = ({
	id,
	accountID,
}: {
	id: number;
	accountID: string;
}): {
	eventID: number;
	accountID: string;
} => ({
	eventID: id,
	accountID,
});

export const getAttendanceForEvent = (schema: Schema) => (
	event: RawEventObject,
): ServerEither<AsyncIter<AttendanceRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findAndBindC<RawAttendanceDBRecord>(getAttendanceEventIdentifier(getEventID(event))))
		.map(generateResults)
		.map(attendanceRecordIterMapper);

export const attendanceRecordMapper = (rec: RawAttendanceDBRecord): AttendanceRecord => ({
	comments: rec.comments,
	customAttendanceFieldValues: rec.customAttendanceFieldValues,
	memberID: rec.memberID,
	memberName: rec.memberName,
	planToUseCAPTransportation: rec.planToUseCAPTransportation,
	status: rec.status,
	summaryEmailSent: rec.summaryEmailSent,
	timestamp: rec.timestamp,
	shiftTime: rec.shiftTime,
	sourceAccountID: rec.accountID,
	sourceEventID: rec.eventID,
});

export const rawAttendanceRecordWrapper = (rec: AttendanceRecord): RawAttendanceDBRecord => ({
	comments: rec.comments,
	customAttendanceFieldValues: rec.customAttendanceFieldValues,
	memberID: rec.memberID,
	accountID: rec.sourceAccountID,
	eventID: rec.sourceEventID,
	memberName: rec.memberName,
	planToUseCAPTransportation: rec.planToUseCAPTransportation,
	shiftTime: rec.shiftTime,
	status: rec.status,
	summaryEmailSent: rec.summaryEmailSent,
	timestamp: rec.timestamp,
});

export const attendanceRecordIterMapper = asyncIterMap(attendanceRecordMapper);

const findForMemberFunc = (now = Date.now) => ({ id: accountID }: AccountObject) => (
	member: MemberReference,
) => (collection: Collection<RawAttendanceDBRecord>) =>
	collection
		.find(
			'memberID.id = :member_id AND memberID.type = :member_type AND accountID = :accountID AND shiftTime.departureTime < :endDateTime',
		)
		.bind('member_id' as any, member.id)
		.bind('member_type' as any, member.type)
		.bind('accountID', accountID)
		.bind('endDateTime' as any, now());

export const getLatestAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference): ServerEither<MaybeObj<AttendanceRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map(find => find.limit(1).sort('shiftTime.departureTime DESC'))
		.map(collectResults)
		.map(Maybe.fromArray)
		.map(Maybe.map(attendanceRecordMapper));
export const getLatestAttendanceForMember = getLatestAttendanceForMemberFunc(Date.now);

export const getAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference): ServerEither<AsyncIter<AttendanceRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map<AsyncIter<RawAttendanceDBRecord>>(generateResults)
		.map(attendanceRecordIterMapper);
export const getAttendanceForMember = getAttendanceForMemberFunc(Date.now);

const attendanceFilterError = errorGenerator('Could not verify attendance permissions');
const arrayHasOneTrue = (arr: boolean[]): boolean => arr.some(identity);

export const getAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	backend
		.getAccount(attendanceRecord.sourceAccountID)
		.flatMap(account =>
			AsyncEither.All([
				backend
					.getEvent(account)(attendanceRecord.sourceEventID)
					.flatMap(newEnsureResolvedEvent(backend)),
				backend.getMember(account)(attendanceRecord.memberID),
			]).flatMap(([event, member]) =>
				AsyncEither.All([
					getDetailedAttendanceFilter(backend)(attendanceViewer)(attendanceRecord),
					event.privateAttendance
						? asyncRight(
								false,
								errorGenerator('Could not verify attendance permissions'),
						  )
						: backend.areMembersInTheSameAccount(attendanceViewer)(member),
				]).map(arrayHasOneTrue),
			),
		);

export const getDetailedAttendanceFilterSansMember = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(newEnsureResolvedEvent(backend))
			.flatMap(event =>
				AsyncEither.All([
					event.teamID === undefined || event.teamID === null
						? asyncRight(
								hasBasicAttendanceManagementPermission(attendanceViewer)(event)(
									Maybe.none(),
								),
								attendanceFilterError,
						  )
						: backend
								.getTeam(account)(event.teamID)
								.map(Maybe.some)
								.map(
									hasBasicAttendanceManagementPermission(attendanceViewer)(event),
								),
					asyncRight(
						effectiveManageEventPermissionForEvent(attendanceViewer)(event) ===
							Permissions.ManageEvent.FULL,
						errorGenerator('Could not verify attendance permissions'),
					),
				]).map(arrayHasOneTrue),
			),
	);

export const getDetailedAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceViewer: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(newEnsureResolvedEvent(backend))
			.flatMap(event =>
				AsyncEither.All([
					asyncRight(
						areMembersTheSame(attendanceViewer)(attendanceRecord.memberID),
						attendanceFilterError,
					),
					event.teamID === undefined || event.teamID === null
						? asyncRight(
								hasBasicAttendanceManagementPermission(attendanceViewer)(event)(
									Maybe.none(),
								),
								attendanceFilterError,
						  )
						: backend
								.getTeam(account)(event.teamID)
								.map(Maybe.some)
								.map(
									hasBasicAttendanceManagementPermission(attendanceViewer)(event),
								),
					asyncRight(
						effectiveManageEventPermissionForEvent(attendanceViewer)(event) ===
							Permissions.ManageEvent.FULL,
						errorGenerator('Could not verify attendance permissions'),
					),
				]).map(arrayHasOneTrue),
			),
	);

export const applyAttendanceFilter = (
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (
	attendanceViewer: User,
): ((iter: AsyncIter<AttendanceRecord>) => AsyncIter<AttendanceRecord>) =>
	pipe(
		asyncIterEitherFilter(getAttendanceFilter(backend)(attendanceViewer)),
		asyncIterMap<AttendanceRecord, AttendanceRecord>(record =>
			AsyncEither.All([
				backend
					.getAccount(record.sourceAccountID)
					.flatMap(account => backend.getEvent(account)(record.sourceEventID))
					.flatMap(backend.ensureResolvedEvent),
				getDetailedAttendanceFilterSansMember(backend)(attendanceViewer)(record),
				asyncRight(
					areMembersTheSame(attendanceViewer)(record.memberID),
					attendanceFilterError,
				),
			])
				.map(([event, canSeeDetails, membersTheSame]) =>
					canSeeDetails || membersTheSame
						? {
								...record,
								customAttendanceFieldValues: record.customAttendanceFieldValues.filter(
									value =>
										canSeeDetails ||
										!!event.customAttendanceFields.find(
											field => field.title === value.title,
										)?.displayToMember,
								),
						  }
						: {
								comments: '',
								customAttendanceFieldValues: [],
								memberID: record.memberID,
								memberName: record.memberName,
								planToUseCAPTransportation: false,
								shiftTime: {
									arrivalTime: event.meetDateTime,
									departureTime: event.pickupDateTime,
								},
								sourceAccountID: record.sourceAccountID,
								sourceEventID: record.sourceEventID,
								status: record.status,
								summaryEmailSent: false,
								timestamp: record.timestamp,
						  },
				)
				.fullJoin()
				.then(identity, always(record)),
		),
	);

export const canMemberModifyRecord = (
	backend: Backends<[TimeBackend, MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
) => (attendanceModifier: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(backend.ensureResolvedEvent)
			.flatMap(event =>
				AsyncEither.All([
					asyncRight(
						areMembersTheSame(attendanceModifier)(attendanceRecord.memberID),
						errorGenerator('Could not verify attendance record owner'),
					),
					asyncRight(
						event.endDateTime < backend.now(),
						errorGenerator('Could not verify event start time'),
					),
					(event.teamID !== undefined && event.teamID !== null
						? backend.getTeam(account)(event.teamID).map(Maybe.some)
						: asyncRight(
								Maybe.none(),
								errorGenerator('Could not verify event permissions'),
						  )
					).map(hasBasicAttendanceManagementPermission(attendanceModifier)(event)),
				]).map(
					([sameMember, pastEditDate, hasManagementPermission]) =>
						(sameMember && !pastEditDate) || hasManagementPermission,
				),
			),
	);

export const canMemberDeleteRecord = (
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
) => (attendanceDeleter: User) => (attendanceRecord: AttendanceRecord): ServerEither<boolean> =>
	backend
		.getAccount(attendanceRecord.sourceAccountID)
		.flatMap(account =>
			backend
				.getEvent(account)(attendanceRecord.sourceEventID)
				.flatMap(backend.ensureResolvedEvent)
				.map(canFullyManageEvent(attendanceDeleter)),
		);

export const visibleCustomAttendanceFields = (
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	backend: Backends<[MemberBackend, AccountBackend, EventsBackend, TeamsBackend]>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
) => (attendanceViewer: User) => (
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	customAttendanceField: AttendanceRecord,
): ServerEither<CustomAttendanceFieldValue[]> => asyncRight([], attendanceFilterError);

export const canMemberModifyCustomAttendanceField = (
	backend: Backends<
		[RawMySQLBackend, MemberBackend, AccountBackend, EventsBackend, TeamsBackend]
	>,
) => (attendanceModifier: User) => (attendanceRecord: AttendanceRecord) => (
	customAttendanceField: CustomAttendanceFieldValue,
): ServerEither<boolean> =>
	backend.getAccount(attendanceRecord.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(attendanceRecord.sourceEventID)
			.flatMap(backend.ensureResolvedEvent)
			.map(
				event =>
					effectiveManageEventPermissionForEvent(attendanceModifier)(event) ===
						Permissions.ManageEvent.FULL ||
					!!getCustomAttendanceFieldForValue(event.customAttendanceFields)(
						customAttendanceField,
					)?.allowMemberToModify,
			),
	);

export const applyAttendanceRecordUpdates = (
	backend: Backends<
		[TimeBackend, RawMySQLBackend, MemberBackend, AccountBackend, EventsBackend, TeamsBackend]
	>,
) => (attendanceModifier: User) => (attendanceRecord: AttendanceRecord) => (
	changes: NewAttendanceRecord,
): ServerEither<void> =>
	backend
		.getAccount(attendanceRecord.sourceAccountID)
		.flatMap(account =>
			backend
				.getEvent(account)(attendanceRecord.sourceEventID)
				.flatMap(backend.ensureResolvedEvent)
				.filter(
					event =>
						(typeof event.teamID === 'number'
							? backend.getTeam(account)(event.teamID).map(Maybe.some)
							: asyncRight(
									Maybe.none(),
									errorGenerator(
										'Could not check permissions for attendance update',
									),
							  )
						).map(hasBasicAttendanceManagementPermission(attendanceModifier)(event)),
					{
						type: 'OTHER',
						code: 403,
						message: 'You do not have permission to modify this attendance record',
					},
				),
		)
		.flatMap(() =>
			AsyncEither.All(
				attendanceRecord.customAttendanceFieldValues.map(value =>
					canMemberModifyCustomAttendanceField(backend)(attendanceModifier)(
						attendanceRecord,
					)(value).map(canModify => ({
						canModify,
						value,
					})),
				),
			),
		)
		.map<AttendanceRecord>(modifiableValues => ({
			timestamp: backend.now(),
			comments: changes.comments ?? attendanceRecord.comments,
			customAttendanceFieldValues: attendanceRecord.customAttendanceFieldValues.map(value => {
				const findResult = modifiableValues.find(
					result => result.value.title === value.title,
				);

				const changedValue = changes.customAttendanceFieldValues.find(
					({ title }) => title === value.title,
				);

				if (findResult?.canModify && changedValue) {
					return changedValue;
				} else {
					return value;
				}
			}),
			memberID: attendanceRecord.memberID,
			memberName: attendanceRecord.memberName,
			planToUseCAPTransportation:
				changes.planToUseCAPTransportation ?? attendanceRecord.planToUseCAPTransportation,
			shiftTime: changes.shiftTime ?? attendanceRecord.shiftTime,
			sourceAccountID: attendanceRecord.sourceAccountID,
			sourceEventID: attendanceRecord.sourceEventID,
			status: changes.status ?? attendanceRecord.status,
			summaryEmailSent: attendanceRecord.summaryEmailSent,
		}))
		.map(rawAttendanceRecordWrapper)
		.flatMap(record =>
			asyncRight(
				backend.getCollection('Attendance'),
				errorGenerator('Cannot save attendance record'),
			)
				.map(
					modifyAndBindC({
						accountID: record.accountID,
						eventID: record.eventID,
						memberID: record.memberID,
					}),
				)
				.map(modify => modify.patch(record).execute()),
		)
		.map(destroy);

export const removeMemberFromEventAttendance = (schema: Schema) => (account: AccountObject) => (
	event: RawEventObject,
) => (member: MemberReference): ServerEither<void> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not delete attendance record'),
	)
		.map(collection =>
			collection
				.remove(
					generateFindStatement({
						accountID: account.id,
						eventID: event.id,
						memberID: toReference(member),
					}),
				)
				.bind(
					generateBindObject({
						accountID: account.id,
						eventID: event.id,
						memberID: toReference(member),
					}),
				)
				.execute(),
		)
		.map(destroy);

const sendSignupDenyMessage = (message: string): ServerEither<void> =>
	asyncLeft({
		type: 'OTHER',
		code: 400,
		message,
	});

export const addMemberToAttendance = (
	backend: Backends<[TeamsBackend, TimeBackend, RawMySQLBackend, MemberBackend]>,
) => (account: AccountObject) => (event: EventObject) => (isAdmin: boolean) => (
	attendee: Required<NewAttendanceRecord>,
): ServerEither<FromDatabase<WithoutEmpty<RawAttendanceDBRecord>>> =>
	(event.teamID !== null && event.teamID !== undefined
		? backend.getTeam(account)(event.teamID).map(Maybe.some)
		: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
	)
		.map(isAdmin ? always(canSignSomeoneElseUpForEvent(event)) : canSignUpForEvent(event))
		.map(call(attendee.memberID))
		.flatMap(
			Either.cata<string, void, ServerEither<void>>(sendSignupDenyMessage)(() =>
				asyncRight(void 0, errorGenerator('Could not add member to attendance')),
			),
		)
		.flatMap(() =>
			backend
				.getMemberName(account)(attendee.memberID)
				.flatMap(memberName =>
					addToCollection(backend.getCollection('Attendance'))({
						...attendee,
						accountID:
							event.type === EventType.LINKED
								? event.targetAccountID
								: event.accountID,
						eventID: event.type === EventType.LINKED ? event.targetEventID : event.id,
						timestamp: backend.now(),
						memberName,
						summaryEmailSent: false,
						shiftTime: attendee.shiftTime ?? {
							arrivalTime: event.meetDateTime,
							departureTime: event.pickupDateTime,
						},
					}),
				)
				.leftFlatMap(err =>
					isDuplicateRecordError(err)
						? Either.left({
								type: 'OTHER',
								code: 400,
								message: 'Member is already in attendance',
						  })
						: Either.left(err),
				),
		);

export const modifyEventAttendanceRecord = (schema: Schema) => (event: RawResolvedEventObject) => (
	member: Member,
) => (record: Omit<Partial<NewAttendanceRecord>, 'memberID'>): ServerEither<void> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not save attendance record'),
	)
		.map(
			modifyAndBindC<RawAttendanceDBRecord>({
				accountID:
					event.type === EventType.LINKED ? event.targetAccountID : event.accountID,
				eventID: event.type === EventType.LINKED ? event.targetEventID : event.id,
				memberID: toReference(member),
			}),
		)
		.map(collection =>
			collection
				.patch({
					...record,
					memberID: toReference(member),
					memberName: getFullMemberName(member),
					shiftTime: record.shiftTime ?? {
						arrivalTime: event.meetDateTime,
						departureTime: event.pickupDateTime,
					},
				})
				.execute(),
		)
		.map(destroy);

export const deleteAttendanceRecord = (backend: Backends<[RawMySQLBackend]>) =>
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(actor: User) => (member: MemberReference) => (
		event: RawResolvedEventObject,
	): ServerEither<void> =>
		asyncRight(
			backend.getCollection('Attendance'),
			errorGenerator('Could not delete attendance record'),
		)
			.map(
				removeAndBindC({
					memberID: toReference(member),
					eventID: event.id,
					accountID: event.accountID,
				}),
			)
			.map(collection => collection.execute())
			.map(destroy);

export const getMemberAttendanceRecordForEvent = (backend: Backends<[RawMySQLBackend]>) => (
	event: RawEventObject,
) => (member: MemberReference): ServerEither<MaybeObj<AttendanceRecord>> =>
	asyncRight(
		backend.getCollection('Attendance'),
		errorGenerator('Could not get member attendance'),
	)
		.map(
			findAndBindC<RawAttendanceDBRecord>({
				accountID: event.accountID,
				eventID: event.id,
				memberID: toReference(member),
			}),
		)
		.map(collectResults)
		.map(Maybe.fromArray)
		.map(Maybe.map(attendanceRecordMapper));

export interface AttendanceBackend {
	getAttendanceForEvent: (event: RawEventObject) => ServerEither<AsyncIter<AttendanceRecord>>;
	getMemberAttendanceRecordForEvent: (
		event: RawEventObject,
	) => (member: MemberReference) => ServerEither<MaybeObj<AttendanceRecord>>;
	getLatestAttendanceForMember: (
		account: AccountObject,
	) => (member: MemberReference) => ServerEither<MaybeObj<AttendanceRecord>>;
	getAttendanceForMember: (
		account: AccountObject,
	) => (member: MemberReference) => ServerEither<AsyncIter<AttendanceRecord>>;
	getAttendanceFilter: (actor: User) => (attendance: AttendanceRecord) => ServerEither<boolean>;
	getDetailedAttendanceFilter: (
		actor: User,
	) => (attendance: AttendanceRecord) => ServerEither<boolean>;
	canMemberModifyRecord: (actor: User) => (record: AttendanceRecord) => ServerEither<boolean>;
	canMemberDeleteRecord: (actor: User) => (record: AttendanceRecord) => ServerEither<boolean>;
	applyAttendanceFilter: (
		actor: User,
	) => (attendance: AsyncIter<AttendanceRecord>) => AsyncIter<AttendanceRecord>;
	applyAttendanceRecordUpdates: (
		actor: User,
	) => (record: AttendanceRecord) => (changes: NewAttendanceRecord) => ServerEither<void>;
	removeMemberFromEventAttendance: (
		actor: User,
	) => (member: MemberReference) => (event: RawResolvedEventObject) => ServerEither<void>;
	addMemberToAttendance: (
		event: RawResolvedEventObject,
	) => (
		forceAdd: boolean,
	) => (attendee: Required<NewAttendanceRecord>) => ServerEither<AttendanceRecord>;
}

export const getRequestFreeAttendanceBackend = (
	mysqlx: Schema,
	prevBackend: Backends<
		[AccountBackend, TimeBackend, MemberBackend, TeamsBackend, EventsBackend, RawMySQLBackend]
	>,
): AttendanceBackend => ({
	getAttendanceForEvent: memoize(event => getAttendanceForEvent(mysqlx)(event), get('id')),
	getAttendanceForMember: memoize(
		account =>
			memoize(
				member => getAttendanceForMember(mysqlx)(account)(member),
				stringifyMemberReference,
			),
		get('id'),
	),
	getLatestAttendanceForMember: memoize(
		account =>
			memoize(
				member => getLatestAttendanceForMember(mysqlx)(account)(member),
				stringifyMemberReference,
			),
		get('id'),
	),
	getAttendanceFilter: user => getAttendanceFilter(prevBackend)(user),
	getDetailedAttendanceFilter: user => getDetailedAttendanceFilter(prevBackend)(user),
	canMemberModifyRecord: canMemberModifyRecord(prevBackend),
	canMemberDeleteRecord: canMemberDeleteRecord(prevBackend),
	applyAttendanceFilter: applyAttendanceFilter(prevBackend),
	applyAttendanceRecordUpdates: applyAttendanceRecordUpdates(prevBackend),
	removeMemberFromEventAttendance: deleteAttendanceRecord(prevBackend),
	getMemberAttendanceRecordForEvent: memoize(
		event =>
			memoize(
				getMemberAttendanceRecordForEvent(prevBackend)(event),
				stringifyMemberReference,
			),
		get('id'),
	),
	addMemberToAttendance: event => forceAdd => attendee =>
		prevBackend.getAccount(event.accountID).flatMap(account =>
			prevBackend
				.getEvent(account)(event.id)
				.flatMap(prevBackend.getFullEventObject)
				.map(addMemberToAttendance(prevBackend)(account))
				.flatMap(f => f(forceAdd)(attendee))
				.map(attendanceRecordMapper),
		),
});

export const getAttendanceBackend = (
	req: BasicAccountRequest,
	prevBackend: Backends<
		[AccountBackend, TimeBackend, MemberBackend, TeamsBackend, EventsBackend]
	>,
): AttendanceBackend =>
	getRequestFreeAttendanceBackend(req.mysqlx, { ...prevBackend, ...req.backend });

export const getEmptyAttendanceBackend = (): AttendanceBackend => ({
	getAttendanceForEvent: () => notImplementedError('getAttendanceForEvent'),
	getAttendanceForMember: () => () => notImplementedError('getAttendanceForMember'),
	getLatestAttendanceForMember: () => () => notImplementedError('getLatestAttendanceForMember'),
	applyAttendanceFilter: () => () => notImplementedException('applyAttendanceFilter'),
	applyAttendanceRecordUpdates: () => () => () =>
		notImplementedError('applyAttendanceRecordUpdates'),
	canMemberDeleteRecord: () => () => notImplementedError('canMemberDeleteRecord'),
	canMemberModifyRecord: () => () => notImplementedError('canMemberModifyRecord'),
	getAttendanceFilter: () => () => notImplementedError('getAttendanceFilter'),
	getDetailedAttendanceFilter: () => () => notImplementedError('getDetailedAttendanceFilter'),
	removeMemberFromEventAttendance: () => () => () =>
		notImplementedError('deleteAttendanceRecord'),
	getMemberAttendanceRecordForEvent: () => () =>
		notImplementedError('getMemberAttendanceRecordForEvent'),
	addMemberToAttendance: () => () => () => notImplementedError('addMemberToAttendance'),
});
