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

import { Collection, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncIterTap,
	asyncLeft,
	asyncRight,
	AttendanceRecord,
	call,
	canSignSomeoneElseUpForEvent,
	canSignUpForEvent,
	collectGeneratorAsync,
	destroy,
	DisplayInternalPointOfContact,
	Either,
	errorGenerator,
	EventAuditEvents,
	EventObject,
	EventStatus,
	EventType,
	ExternalPointOfContact,
	FromDatabase,
	get,
	getFullMemberName,
	getItemsNotInSecondArray,
	identity,
	InternalPointOfContact,
	isPOCOf,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	NewAttendanceRecord,
	NewEventObject,
	NotificationCauseType,
	NotificationDataType,
	NotificationTargetType,
	PointOfContact,
	PointOfContactType,
	RawEventObject,
	RawLinkedEvent,
	RawRegularEventObject,
	RawResolvedEventObject,
	RawResolvedLinkedEvent,
	ServerConfiguration,
	ServerError,
	Some,
	toReference,
} from 'common-lib';
import { AccountGetter, getAccount, getMemoizedAccountGetter } from './Account';
import {
	generateChangeAudit,
	generateCreationAudit,
	areDeepEqual,
	generateDeleteAudit,
	saveAudit,
} from './Audits';
import updateGoogleCalendars, {
	createGoogleCalendarEvents,
	removeGoogleCalendarEvents,
} from './GoogleUtils';
import { getMemberName, isMemberPartOfAccount, resolveReference } from './Members';
import {
	addToCollection,
	collectResults,
	deleteItemFromCollectionA,
	findAndBind,
	findAndBindC,
	generateBindObject,
	generateFindStatement,
	generateResults,
	getNewID,
	modifyAndBindC,
	saveToCollectionA,
} from './MySQLUtil';
import { createNotification } from './Notification';
import { ServerEither } from './servertypes';
import { getTeam } from './Team';

type POCRaw = (ExternalPointOfContact | InternalPointOfContact)[];
type POCFull = (ExternalPointOfContact | DisplayInternalPointOfContact)[];

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

export { EventStatus };

export const getEventID = (event: RawEventObject) =>
	event.type === EventType.LINKED
		? {
				id: event.targetEventID,
				accountID: event.targetAccountID,
		  }
		: {
				id: event.id,
				accountID: event.accountID,
		  };

export const getFullPointsOfContact = (schema: Schema) => (account: AccountObject) => (
	records: POCRaw,
): ServerEither<POCFull> =>
	AsyncEither.All(
		records.map<ServerEither<DisplayInternalPointOfContact | ExternalPointOfContact>>(poc =>
			poc.type === PointOfContactType.INTERNAL
				? getMemberName(schema)(account)(poc.memberReference).map(name => ({
						...poc,
						name,
				  }))
				: asyncRight(poc, errorGenerator('Could not get point of contact data')),
		),
	);

export const getSimplePointsOfContact = (
	records: (ExternalPointOfContact | InternalPointOfContact | DisplayInternalPointOfContact)[],
): POCRaw =>
	records.map(poc =>
		poc.type === PointOfContactType.EXTERNAL
			? poc
			: {
					type: PointOfContactType.INTERNAL,
					email: poc.email,
					memberReference: poc.memberReference,
					phone: poc.phone,
					position: poc.position,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
			  },
	);

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

export const attendanceRecordIterMapper = asyncIterMap(attendanceRecordMapper);

const findForMemberFunc = (now = Date.now) => ({ id: accountID }: AccountObject) => (
	member: MemberReference,
) => (collection: Collection<RawAttendanceDBRecord>) =>
	collection
		.find(
			'memberID.id = :member_id AND memberID.type = :member_type AND accountID = :accountID AND shiftTime.departureTime < :endDateTime',
		)
		// @ts-ignore
		.bind('member_id', member.id)
		// @ts-ignore
		.bind('member_type', member.type)
		.bind('accountID', accountID)
		// @ts-ignore
		.bind('endDateTime', now());

export const getLatestAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference): ServerEither<MaybeObj<RawAttendanceDBRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map(find => find.limit(1).sort('shiftTime.departureTime DESC'))
		.map(collectResults)
		.map(Maybe.fromArray);
export const getLatestAttendanceForMember = getLatestAttendanceForMemberFunc(Date.now);

export const getAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map<AsyncIter<RawAttendanceDBRecord>>(generateResults);
export const getAttendanceForMember = getAttendanceForMemberFunc(Date.now);

export const getLinkedEvents = (schema: Schema) => (accountID: string) => (
	eventID: number,
): AsyncIter<RawLinkedEvent> =>
	generateResults(
		findAndBind(schema.getCollection<RawLinkedEvent>('Events'), {
			targetEventID: eventID,
			targetAccountID: accountID,
			type: EventType.LINKED,
		}),
	);

const attendanceRecordBelongsToAccount = (accountGetter: AccountGetter) => (schema: Schema) => (
	accountID: string,
) => (attendanceRecord: AttendanceRecord) =>
	accountGetter
		.byId(schema)(accountID)
		.flatMap(account =>
			resolveReference(schema)(account)(attendanceRecord.memberID).flatMap(member =>
				isMemberPartOfAccount(accountGetter)(schema)(member)(account),
			),
		);

const getAttendanceEventIdentifier = ({ id, accountID }: { id: number; accountID: string }) => ({
	eventID: id,
	accountID,
});

export const getAttendanceForEvent = (schema: Schema) => (
	viewingAccount: MaybeObj<AccountObject>,
) => (event: RawEventObject) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findAndBindC<RawAttendanceDBRecord>(getAttendanceEventIdentifier(getEventID(event))))
		.map(generateResults)
		.map(attendanceRecordIterMapper)
		.map(
			Maybe.isSome(viewingAccount)
				? asyncIterFilter(record =>
						attendanceRecordBelongsToAccount(getMemoizedAccountGetter(schema))(schema)(
							viewingAccount.value.id,
						)(record)
							.fullJoin()
							.catch(always(false)),
				  )
				: identity,
		);

export const getFullEventObject = (schema: Schema) => (account: AccountObject) => (
	viewingAccount: MaybeObj<AccountObject>,
) => (viewer: MaybeObj<MemberReference>) => (forceAllAttendance: boolean) => (
	event: FromDatabase<RawEventObject>,
): ServerEither<FromDatabase<EventObject>> =>
	ensureResolvedEvent(schema)(event).flatMap(eventInfo =>
		(Maybe.isSome(viewer)
			? getFullPointsOfContact(schema)(account)(eventInfo.pointsOfContact)
			: asyncRight<ServerError, POCFull>([], {
					type: 'OTHER',
					code: 500,
					message: 'Could not get points of contact',
			  })
		).flatMap(pointsOfContact =>
			(viewer.hasValue &&
				(!eventInfo.privateAttendance || isPOCOf(viewer.value, eventInfo))) ||
			forceAllAttendance
				? getAttendanceForEvent(schema)(viewingAccount)(event)
						.map(collectGeneratorAsync)
						.map(attendance => ({
							...eventInfo,
							pointsOfContact,
							attendance,
						}))
				: asyncRight(
						{
							...eventInfo,
							pointsOfContact,
							attendance: [],
						},
						errorGenerator('Could not get event with attendance'),
				  ),
		),
	);

export const removeMemberFromEventAttendance = (schema: Schema) => (account: AccountObject) => (
	event: RawEventObject,
) => (member: MemberReference) =>
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

export const addMemberToAttendanceFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (event: EventObject) => (isAdmin: boolean) => (attendee: Required<NewAttendanceRecord>) =>
	(event.teamID !== null && event.teamID !== undefined
		? getTeam(schema)(account)(event.teamID).map(Maybe.some)
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
			getMemberName(schema)(account)(attendee.memberID).flatMap(memberName =>
				addToCollection(schema.getCollection<RawAttendanceDBRecord>('Attendance'))({
					...attendee,
					accountID:
						event.type === EventType.LINKED ? event.targetAccountID : event.accountID,
					eventID: event.type === EventType.LINKED ? event.targetEventID : event.id,
					timestamp: now(),
					memberName,
					summaryEmailSent: false,
					shiftTime: attendee.shiftTime ?? {
						arrivalTime: event.meetDateTime,
						departureTime: event.pickupDateTime,
					},
				}),
			),
		);
export const addMemberToAttendance = addMemberToAttendanceFunc(Date.now);

export const modifyEventAttendanceRecord = (schema: Schema) => (account: AccountObject) => (
	event: RawResolvedEventObject,
) => (member: Member) => (record: Omit<Partial<NewAttendanceRecord>, 'memberID'>) =>
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

export const getSourceEvent = (schema: Schema) => (
	event: RawEventObject,
): ServerEither<MaybeObj<FromDatabase<RawRegularEventObject>>> =>
	event.type === EventType.LINKED
		? getAccount(schema)(event.targetAccountID)
				.flatMap(
					account =>
						// Links cannot be made to links, so by resolving a link we actually get an event
						getEvent(schema)(account)(event.targetEventID) as AsyncEither<
							ServerError,
							FromDatabase<RawRegularEventObject>
						>,
				)
				.map(Maybe.some)
		: asyncRight(Maybe.none(), errorGenerator('Could not get source event'));

export const getEvent = (schema: Schema) => (account: AccountObject) => (
	eventID: number | string,
): ServerEither<FromDatabase<RawEventObject>> =>
	asyncRight(parseInt(eventID + '', 10), errorGenerator('There was a problem getting the event'))
		.filter(id => !isNaN(id), {
			type: 'OTHER',
			code: 400,
			message: 'Invalid event ID',
		})
		.flatMap(id =>
			asyncRight(
				schema.getCollection<FromDatabase<RawEventObject>>('Events'),
				errorGenerator('Could not get event'),
			)
				.map(
					findAndBindC<FromDatabase<RawEventObject>>({
						accountID: account.id,
						id,
					}),
				)
				.map(collectResults),
		)
		.filter(results => results.length === 1, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find event specified',
		})
		.map(get(0));

export const getAudit = (schema: Schema) => (account: AccountObject) => (
	eventID: number | string,
): ServerEither<AsyncIter<FromDatabase<EventAuditEvents>>> =>
	getEvent(schema)(account)(eventID).flatMap(auditResults =>
		asyncRight(
			schema.getCollection<FromDatabase<EventAuditEvents>>('Audits'),
			errorGenerator('No audit results'),
		)
			.map(
				findAndBindC<FromDatabase<EventAuditEvents>>({
					targetID: auditResults._id,
					target: 'Event',
				}),
			)
			.map(generateResults),
	);

export const ensureResolvedEvent = (schema: Schema) => (
	event: FromDatabase<RawEventObject>,
): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	event.type === EventType.LINKED
		? getAccount(schema)(event.targetAccountID).flatMap(account =>
				// Links cannot be made to links, so by resolving a link we actually get an event
				(getEvent(schema)(account)(event.targetEventID) as AsyncEither<
					ServerError,
					FromDatabase<RawRegularEventObject>
				>).map<FromDatabase<RawResolvedEventObject>>(
					resolvedEvent =>
						({
							...resolvedEvent,
							...event,
							...event.extraProperties,
						} as FromDatabase<RawResolvedEventObject>),
				),
		  )
		: asyncRight(event, errorGenerator('Could not resolve event reference'));

const sendPOCNotifications = (delta: 'ADDED' | 'REMOVED') => (schema: Schema) => (
	account: AccountObject,
) => (event: RawRegularEventObject) => (pocs: InternalPointOfContact[]) =>
	AsyncEither.All(
		pocs.map(poc =>
			createNotification(schema)(account)({
				target: {
					type: NotificationTargetType.MEMBER,
					to: poc.memberReference,
				},
				cause: {
					type: NotificationCauseType.SYSTEM,
				},
				extraData: {
					accountID: event.accountID,
					delta,
					eventID: event.id,
					eventName: event.name,
					type: NotificationDataType.EVENT,
				},
			}),
		),
	).map(destroy);

const sendPOCRemovedNotifications = sendPOCNotifications('REMOVED');
const sendPOCAddedNotifications = sendPOCNotifications('ADDED');

export const getEventDifferences = <T extends object>(oldObj: T, newObj: T): Partial<T> => {
	const changes: Partial<T> = {};

	for (const key in oldObj) {
		// These aren't interesting differences
		if (key === 'id' || key === '_id' || key === 'type' || key === 'accountID') {
			continue;
		}

		if (
			oldObj.hasOwnProperty(key) &&
			newObj.hasOwnProperty(key) &&
			!areDeepEqual(oldObj[key], newObj[key])
		) {
			changes[key] = newObj[key];
		}
	}

	return changes;
};

export const saveLinkedEventFunc = (config: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (updater: MemberReference) => (oldEvent: FromDatabase<RawResolvedLinkedEvent>) => (
	event: RawResolvedLinkedEvent,
): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	AsyncEither.All([
		asyncRight(
			updateGoogleCalendars(
				schema,
				{
					...event,
					id: event.targetEventID,
					accountID: event.targetAccountID,
					type: EventType.REGULAR,
				},
				account,
				config,
			),
			errorGenerator('Could not update Google calendar'),
		),
		(getSourceEvent(schema)(event).filter(Maybe.isSome, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find source event',
		}) as ServerEither<Some<RawResolvedEventObject>>).map(({ value }) => value),
	])
		.map<FromDatabase<RawLinkedEvent>>(([[mainId, regId, feeId], sourceEvent]) => ({
			_id: oldEvent._id,
			accountID: event.accountID,
			extraProperties: getEventDifferences(sourceEvent, event),
			googleCalendarIds: {
				mainId,
				regId,
				feeId,
			},
			id: event.id,
			linkAuthor: event.linkAuthor,
			meetDateTime: event.meetDateTime,
			pickupDateTime: event.pickupDateTime,
			targetAccountID: event.targetAccountID,
			targetEventID: event.targetEventID,
			type: EventType.LINKED,
		}))
		.flatMap(saveToCollectionA(schema.getCollection<FromDatabase<RawLinkedEvent>>('Events')))
		// TODO: Actually change generateChangeAudit to handle linked events properly
		// .tap(newEvent =>
		// 	generateChangeAudit(schema)(account)(updater)(oldEvent)(newEvent).flatMap(
		// 		saveAudit(schema),
		// 	),
		// )
		.flatMap(ensureResolvedEvent(schema));

export const saveRegularEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (updater: MemberReference) => (
	oldEvent: FromDatabase<RawRegularEventObject>,
) => (event: RawRegularEventObject): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	asyncRight(
		updateGoogleCalendars(schema, event, account, config),
		errorGenerator('Could not update Google calendar'),
	)
		.map<FromDatabase<RawRegularEventObject>>(([mainId, regId, feeId]) => ({
			_id: oldEvent._id,
			acceptSignups: event.acceptSignups,
			accountID: event.accountID,
			activity: event.activity,
			administrationComments: event.administrationComments,
			author: event.author,
			comments: event.comments,
			complete: event.complete,
			customAttendanceFields: event.customAttendanceFields,
			debrief: event.debrief,
			desiredNumberOfParticipants: event.desiredNumberOfParticipants,
			endDateTime: event.endDateTime,
			eventWebsite: event.eventWebsite,
			fileIDs: event.fileIDs,
			googleCalendarIds: {
				mainId,
				regId,
				feeId,
			},
			groupEventNumber: event.groupEventNumber,
			highAdventureDescription: event.highAdventureDescription,
			id: event.id,
			limitSignupsToTeam: event.limitSignupsToTeam,
			location: event.location,
			lodgingArrangments: event.lodgingArrangments,
			mealsDescription: event.mealsDescription,
			meetDateTime: event.meetDateTime,
			meetLocation: event.meetLocation,
			memberComments: event.memberComments,
			name: event.name,
			participationFee: event.participationFee,
			pickupDateTime: event.pickupDateTime,
			pickupLocation: event.pickupLocation,
			pointsOfContact: getSimplePointsOfContact(event.pointsOfContact),
			privateAttendance: event.privateAttendance,
			regionEventNumber: event.regionEventNumber,
			registration: event.registration,
			requiredEquipment: event.requiredEquipment,
			requiredForms: event.requiredForms,
			showUpcoming: event.showUpcoming,
			signUpDenyMessage: event.signUpDenyMessage,
			signUpPartTime: event.signUpPartTime,
			startDateTime: event.startDateTime,
			status: event.status,
			subtitle: event.subtitle,
			teamID: event.teamID,
			timeCreated: event.timeCreated,
			timeModified: now(),
			transportationDescription: event.transportationDescription,
			transportationProvided: event.transportationProvided,
			uniform: event.uniform,
			type: EventType.REGULAR,
		}))
		.tap(notifyEventPOCs(schema)(account)(oldEvent))
		.flatMap(
			saveToCollectionA(schema.getCollection<FromDatabase<RawRegularEventObject>>('Events')),
		)
		.tap(updateGoogleCalendarsForLinkedEvents(config)(schema))
		.tap(updateLinkedEvents(schema))
		.tap(newEvent =>
			generateChangeAudit(schema)(account)(updater)(oldEvent)(newEvent).flatMap(
				saveAudit(schema),
			),
		);

export const saveEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (updater: MemberReference) => <T extends RawResolvedEventObject>(
	oldEvent: FromDatabase<T>,
) => (event: T): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	event.type === EventType.LINKED && oldEvent.type === EventType.LINKED
		? saveLinkedEventFunc(config)(schema)(account)(updater)(
				(oldEvent as unknown) as FromDatabase<RawResolvedLinkedEvent>,
		  )((event as unknown) as RawResolvedLinkedEvent)
		: event.type === EventType.REGULAR && oldEvent.type === EventType.REGULAR
		? saveRegularEventFunc(now)(config)(schema)(account)(updater)(
				(oldEvent as unknown) as FromDatabase<RawRegularEventObject>,
		  )((event as unknown) as RawRegularEventObject)
		: asyncLeft<ServerError, FromDatabase<RawResolvedEventObject>>({
				type: 'OTHER',
				code: 400,
				message: 'Mismatched event types for event save',
		  });
export const saveEvent = saveEventFunc();

export const removeItemFromEventDebrief = (event: RawRegularEventObject) => (
	timeToRemove: number,
) => ({
	...event,
	debrief: event.debrief.filter(({ timeSubmitted }) => timeSubmitted !== timeToRemove),
});

export const deleteEvent = (config: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (actor: MemberReference) => (
	event: FromDatabase<RawResolvedEventObject>,
): ServerEither<void> =>
	asyncRight(
		removeGoogleCalendarEvents(event, account, config),
		errorGenerator('Could not delete Google calendar events'),
	)
		.map(always(event))
		.tap(deletedEvent =>
			generateDeleteAudit(schema)(account)(actor)(deletedEvent).flatMap(saveAudit(schema)),
		)
		.flatMap(deleteItemFromCollectionA(schema.getCollection<RawEventObject>('Events')));

export const createEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (author: MemberReference) => (data: NewEventObject) =>
	getNewID(account)(schema.getCollection<RawEventObject>('Events'))
		.map<RawRegularEventObject>(id => ({
			acceptSignups: data.acceptSignups,
			activity: data.activity,
			administrationComments: data.administrationComments,
			comments: data.comments,
			complete: data.complete,
			customAttendanceFields: data.customAttendanceFields,
			desiredNumberOfParticipants: data.desiredNumberOfParticipants,
			endDateTime: data.endDateTime,
			eventWebsite: data.eventWebsite,
			fileIDs: data.fileIDs,
			groupEventNumber: data.groupEventNumber,
			highAdventureDescription: data.highAdventureDescription,
			limitSignupsToTeam: data.limitSignupsToTeam,
			location: data.location,
			lodgingArrangments: data.lodgingArrangments,
			mealsDescription: data.mealsDescription,
			meetDateTime: data.meetDateTime,
			meetLocation: data.meetLocation,
			memberComments: data.memberComments,
			name: data.name,
			participationFee: data.participationFee,
			pickupDateTime: data.pickupDateTime,
			pickupLocation: data.pickupLocation,
			pointsOfContact: data.pointsOfContact,
			privateAttendance: data.privateAttendance,
			regionEventNumber: data.regionEventNumber,
			registration: data.registration,
			requiredEquipment: data.requiredEquipment,
			requiredForms: data.requiredForms,
			showUpcoming: data.showUpcoming,
			signUpDenyMessage: data.signUpDenyMessage,
			signUpPartTime: data.signUpPartTime,
			startDateTime: data.startDateTime,
			status: data.status,
			subtitle: data.subtitle,
			teamID: data.teamID,
			transportationDescription: data.transportationDescription,
			transportationProvided: data.transportationProvided,
			uniform: data.uniform,

			id,
			accountID: account.id,
			author: toReference(author),
			timeCreated: now(),
			timeModified: now(),
			debrief: [],
			googleCalendarIds: {},
			type: EventType.REGULAR,
		}))
		.flatMap(event =>
			asyncRight(
				createGoogleCalendarEvents(schema, event, account, config),
				errorGenerator('Could not create Google calendar events'),
			).map<RawRegularEventObject>(([mainId, regId, feeId]) => ({
				...event,
				googleCalendarIds: {
					mainId,
					regId,
					feeId,
				},
			})),
		)
		.flatMap(
			addToCollection(schema.getCollection<FromDatabase<RawRegularEventObject>>('Events')),
		)
		.tap(event => generateCreationAudit(schema)(account)(author)(event).map(saveAudit(schema)));
export const createEvent = createEventFunc(Date.now);

export const copyEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (event: RawResolvedEventObject) => (author: MemberReference) => (
	newStartTime: number,
) => (newStatus: EventStatus) => (copyFiles = false) =>
	asyncRight(newStartTime - event.startDateTime, errorGenerator('Could not copy event'))
		.map(timeDelta => ({
			...event,

			fileIDs: copyFiles ? event.fileIDs : [],
			status: newStatus,

			meetDateTime: event.meetDateTime + timeDelta,
			startDateTime: event.startDateTime + timeDelta,
			endDateTime: event.endDateTime + timeDelta,
			pickupDateTime: event.pickupDateTime + timeDelta,
		}))
		.flatMap(createEventFunc(now)(config)(schema)(account)(author));
export const copyEvent = copyEventFunc(Date.now);

export const linkEvent = (config: ServerConfiguration) => (schema: Schema) => (
	linkedEvent: RawEventObject,
) => (linkAuthor: MemberReference) => (
	targetAccount: AccountObject,
): ServerEither<RawLinkedEvent> =>
	asyncRight(linkedEvent, errorGenerator('Could not link event'))
		.flatMap<RawResolvedEventObject>(event =>
			event.type === EventType.REGULAR
				? asyncRight(event, errorGenerator('Could not link event'))
				: getAccount(schema)(event.targetAccountID).flatMap(account =>
						getEvent(schema)(account)(event.targetEventID).flatMap(
							ensureResolvedEvent(schema),
						),
				  ),
		)
		.flatMap(event =>
			getNewID(targetAccount)(schema.getCollection<RawEventObject>('Events')).flatMap(id =>
				asyncRight(
					createGoogleCalendarEvents(
						schema,
						{ ...event, id, accountID: targetAccount.id, type: EventType.REGULAR },
						targetAccount,
						config,
					),
					errorGenerator('Could not create google calendar events'),
				).map<RawLinkedEvent>(([mainId, regId, feeId]) => ({
					accountID: targetAccount.id,
					id,
					linkAuthor,
					targetAccountID: linkedEvent.accountID,
					targetEventID: linkedEvent.id,
					type: EventType.LINKED,
					googleCalendarIds: {
						mainId,
						regId,
						feeId,
					},
					extraProperties: {},
					meetDateTime: event.meetDateTime,
					pickupDateTime: event.pickupDateTime,
				})),
			),
		)
		.flatMap(addToCollection(schema.getCollection<RawLinkedEvent>('Events')));

const updateLinkedEvents = (schema: Schema) => (savedEvent: RawRegularEventObject) =>
	collectGeneratorAsync(
		asyncIterHandler(errorGenerator('Could not handle updating sub google calendars'))(
			asyncIterTap<RawLinkedEvent>(ev =>
				saveToCollectionA(schema.getCollection<RawLinkedEvent>('Events'))(ev).then(destroy),
			)(
				asyncIterMap<RawLinkedEvent, RawLinkedEvent>(event => ({
					...event,
					pickupDateTime: savedEvent.pickupDateTime,
					meetDateTime: savedEvent.meetDateTime,
				}))(getLinkedEvents(schema)(savedEvent.accountID)(savedEvent.id)),
			),
		),
	);

const updateGoogleCalendarsForLinkedEvents = (config: ServerConfiguration) => (schema: Schema) => (
	savedEvent: RawRegularEventObject,
) =>
	collectGeneratorAsync(
		asyncIterHandler(errorGenerator('Could not handle updating sub google calendars'))(
			asyncIterTap<[RawLinkedEvent, AccountObject]>(([linkedEvent, eventAccount]) =>
				updateGoogleCalendars(
					schema,
					{
						...savedEvent,
						...linkedEvent,
						type: EventType.REGULAR,
					},
					eventAccount,
					config,
				).then(destroy),
			)(
				asyncIterMap<RawLinkedEvent, [RawLinkedEvent, AccountObject]>(linkedEvent =>
					getAccount(schema)(linkedEvent.accountID)
						.map<[RawLinkedEvent, AccountObject]>(linkedAccount => [
							linkedEvent,
							linkedAccount,
						])
						.fullJoin(),
				)(getLinkedEvents(schema)(savedEvent.accountID)(savedEvent.id)),
			),
		),
	);

const notifyEventPOCs = (schema: Schema) => (account: AccountObject) => (
	oldEvent: RawRegularEventObject,
) => (newEvent: RawRegularEventObject) => {
	const isInternalPOC = (poc: PointOfContact): poc is InternalPointOfContact =>
		poc.type === PointOfContactType.INTERNAL;
	const oldInternalPOCs = oldEvent.pointsOfContact.filter(isInternalPOC);
	const newInternalPOCs = newEvent.pointsOfContact.filter(isInternalPOC);

	const pocGetter = getItemsNotInSecondArray<InternalPointOfContact>(item1 => item2 =>
		areMembersTheSame(item1.memberReference)(item2.memberReference),
	);

	const removedPOCs = pocGetter(oldInternalPOCs)(newInternalPOCs);
	const addedPOCs = pocGetter(newInternalPOCs)(oldInternalPOCs);

	return AsyncEither.All([
		sendPOCRemovedNotifications(schema)(account)(newEvent)(removedPOCs),
		sendPOCAddedNotifications(schema)(account)(newEvent)(addedPOCs),
	]);
};
