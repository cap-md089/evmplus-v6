/**
 * Copyright (C) 2020 Andrew Rioux
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
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterFilter,
	asyncIterFlatMap,
	asyncIterHandler,
	asyncIterMap,
	asyncIterTap,
	asyncLeft,
	asyncRight,
	AttendanceRecord,
	collectGeneratorAsync,
	destroy,
	DisplayInternalPointOfContact,
	Either,
	EitherObj,
	errorGenerator,
	EventAuditEvents,
	EventObject,
	EventStatus,
	EventType,
	ExternalPointOfContact,
	FromDatabase,
	get,
	getItemsNotInSecondArray,
	InternalPointOfContact,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	memoize,
	NewEventObject,
	NotificationCauseType,
	NotificationDataType,
	NotificationTargetType,
	pipe,
	PointOfContact,
	PointOfContactType,
	RawEventObject,
	RawLinkedEvent,
	RawRegularEventObject,
	RawResolvedEventObject,
	RawResolvedLinkedEvent,
	Right,
	ServerError,
	toAsyncIterableIterator,
	toReference,
} from 'common-lib';
import { AuditsBackend, EmailBackend, MemberBackend, RegistryBackend, SYSTEM_BCC_ADDRESS } from '.';
import { AccountBackend, BasicAccountRequest, getAccount } from './Account';
import { getAttendanceForEvent } from './Attendance';
import { areDeepEqual } from './Audits';
import { Backends, notImplementedError, TimeBackend } from './backends';
import { GoogleBackend } from './GoogleUtils';
import { getMemberName } from './Members';
import {
	addToCollection,
	collectResults,
	deleteItemFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	getNewID,
	saveToCollectionA,
} from './MySQLUtil';
import { createNotification } from './Notification';
import { ServerEither } from './servertypes';

type POCRaw = Array<ExternalPointOfContact | InternalPointOfContact>;
type POCFull = Array<ExternalPointOfContact | DisplayInternalPointOfContact>;

export { EventStatus };

export const getEventID = (event: RawEventObject): { id: number; accountID: string } =>
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
	records: Array<ExternalPointOfContact | InternalPointOfContact | DisplayInternalPointOfContact>,
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
					publicDisplay: poc.publicDisplay,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
			  },
	);

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

export const getFullEventObject = (schema: Schema) => (account: AccountObject) => (
	event: FromDatabase<RawEventObject>,
): ServerEither<FromDatabase<EventObject>> =>
	ensureResolvedEvent(schema)(event).flatMap(eventInfo =>
		getFullPointsOfContact(schema)(account)(eventInfo.pointsOfContact).flatMap(
			pointsOfContact =>
				getAttendanceForEvent(schema)(event)
					.map(collectGeneratorAsync)
					.map(attendance => ({
						...eventInfo,
						pointsOfContact,
						attendance,
					})),
		),
	);

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
	asyncRight(
		parseInt(eventID.toString(), 10),
		errorGenerator('There was a problem getting the event'),
	)
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

export const newEnsureResolvedEvent = (backend: Backends<[EventsBackend, AccountBackend]>) => (
	event: FromDatabase<RawEventObject>,
): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	event.type === EventType.LINKED
		? backend.getAccount(event.targetAccountID).flatMap(account =>
				// Links cannot be made to links, so by resolving a link we actually get an event
				(backend.getEvent(account)(event.targetEventID) as AsyncEither<
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

export const saveLinkedEventFunc = (backend: Backends<[GoogleBackend]>) => (schema: Schema) => (
	oldEvent: FromDatabase<RawResolvedLinkedEvent>,
) => (event: RawResolvedLinkedEvent): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	AsyncEither.All([
		backend.updateGoogleCalendars({
			...event,
			id: event.targetEventID,
			accountID: event.targetAccountID,
			type: EventType.REGULAR,
		}),
		getSourceEvent(schema)(event)
			.filter(Maybe.isSome, {
				type: 'OTHER',
				code: 404,
				message: 'Could not find source event',
			})
			.map(({ value }) => value as RawResolvedEventObject),
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

export const saveRegularEventFunc = (
	backend: Backends<
		[TimeBackend, GoogleBackend, AuditsBackend, MemberBackend, EmailBackend, RegistryBackend]
	>,
) => (schema: Schema) => (account: AccountObject) => (updater: MemberReference) => (
	oldEvent: FromDatabase<RawRegularEventObject>,
) => (event: RawRegularEventObject): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	backend
		.updateGoogleCalendars(event)  // need return value to update event object prior to save
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
			emailBody: event.emailBody,
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
			requirementTag: event.requirementTag,
			showUpcoming: event.showUpcoming,
			signUpDenyMessage: event.signUpDenyMessage,
			signUpPartTime: event.signUpPartTime,
			startDateTime: event.startDateTime,
			status: event.status,
			subtitle: event.subtitle,
			teamID: event.teamID,
			timeCreated: event.timeCreated,
			timeModified: backend.now(),
			transportationDescription: event.transportationDescription,
			transportationProvided: event.transportationProvided,
			smuniform: event.smuniform,
			cuniform: event.cuniform,
			type: EventType.REGULAR,
		}))
		.tap(() => notifyEventPOCs(schema)(account)(oldEvent)(event))
		.tap(() =>
			oldEvent.status !== EventStatus.CANCELLED && event.status === EventStatus.CANCELLED
				? sendCancelEmail(backend)(schema)(account)(event)(updater)
				: asyncRight(void 0, errorGenerator('should not reach this')),
		)
		.flatMap(
			saveToCollectionA(schema.getCollection<FromDatabase<RawRegularEventObject>>('Events')),
		)
		.tap(updateGoogleCalendarsForLinkedEvents(backend)(schema))
		.tap(updateLinkedEvents(schema))
		.tap(newEvent => backend.generateChangeAudit(account)(updater)([oldEvent, newEvent]));

export const saveEvent = (
	backends: Backends<
		[TimeBackend, GoogleBackend, AuditsBackend, MemberBackend, EmailBackend, RegistryBackend]
	>,
) => (schema: Schema) => (account: AccountObject) => (updater: MemberReference) => <
	T extends RawResolvedEventObject
>(
	oldEvent: FromDatabase<T>,
) => (event: T): ServerEither<FromDatabase<RawResolvedEventObject>> =>
	event.type === EventType.LINKED && oldEvent.type === EventType.LINKED
		? saveLinkedEventFunc(backends)(schema)(
				(oldEvent as unknown) as FromDatabase<RawResolvedLinkedEvent>,
		  )((event as unknown) as RawResolvedLinkedEvent)
		: event.type === EventType.REGULAR && oldEvent.type === EventType.REGULAR
		? saveRegularEventFunc(backends)(schema)(account)(updater)(
				(oldEvent as unknown) as FromDatabase<RawRegularEventObject>,
		  )((event as unknown) as RawRegularEventObject)
		: asyncLeft<ServerError, FromDatabase<RawResolvedEventObject>>({
				type: 'OTHER',
				code: 400,
				message: 'Mismatched event types for event save',
		  });

export const removeItemFromEventDebrief = <T extends RawRegularEventObject>(event: T) => (
	timeToRemove: number,
): T => ({
	...event,
	debrief: event.debrief.filter(({ timeSubmitted }) => timeSubmitted !== timeToRemove),
});

export const deleteEvent = (backend: Backends<[TimeBackend, GoogleBackend, AuditsBackend]>) => (
	schema: Schema,
) => (account: AccountObject) => (actor: MemberReference) => (
	event: FromDatabase<RawResolvedEventObject>,
): ServerEither<void> =>
	backend
		.removeGoogleCalendarEvents(event)
		.map(always(event))
		.tap(backend.generateDeleteAudit(account)(actor))
		.flatMap(deleteItemFromCollectionA(schema.getCollection<RawEventObject>('Events')));

export const createEvent = (backend: Backends<[GoogleBackend, TimeBackend, AuditsBackend]>) => (
	schema: Schema,
) => (account: AccountObject) => (author: MemberReference) => (
	data: NewEventObject,
): ServerEither<FromDatabase<RawRegularEventObject>> =>
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
			emailBody: data.emailBody,
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
			requirementTag: data.requirementTag,
			teamID: data.teamID,
			transportationDescription: data.transportationDescription,
			transportationProvided: data.transportationProvided,
			smuniform: data.smuniform,
			cuniform: data.cuniform,
			id,
			accountID: account.id,
			author: toReference(author),
			timeCreated: backend.now(),
			timeModified: backend.now(),
			debrief: [],
			googleCalendarIds: {},
			type: EventType.REGULAR,
		}))
		.flatMap(event =>
			backend
				.createGoogleCalendarEvents(event)
				.map<RawRegularEventObject>(([mainId, regId, feeId]) => ({
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
		.tap(backend.generateCreationAudit(account)(author));

export const copyEvent = (backend: Backends<[TimeBackend, GoogleBackend, AuditsBackend]>) => (
	schema: Schema,
) => (account: AccountObject) => (event: RawResolvedEventObject) => (author: MemberReference) => (
	newStartTime: number,
) => (newStatus: EventStatus) => (
	copyFiles = false,
): ServerEither<FromDatabase<RawRegularEventObject>> =>
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
		.flatMap(createEvent(backend)(schema)(account)(author));

export const linkEvent = (backend: Backends<[GoogleBackend]>) => (schema: Schema) => (
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
				backend
					.createGoogleCalendarEvents({
						...event,
						id,
						accountID: targetAccount.id,
						type: EventType.REGULAR,
					})
					.map<RawLinkedEvent>(([mainId, regId, feeId]) => ({
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
			toAsyncIterableIterator(
				asyncIterTap<RawLinkedEvent>(ev =>
					saveToCollectionA(schema.getCollection<RawLinkedEvent>('Events'))(ev).then(
						destroy,
					),
				)(
					asyncIterMap<RawLinkedEvent, RawLinkedEvent>(event => ({
						...event,
						pickupDateTime: savedEvent.pickupDateTime,
						meetDateTime: savedEvent.meetDateTime,
					}))(getLinkedEvents(schema)(savedEvent.accountID)(savedEvent.id)),
				),
			),
		),
	);

const updateGoogleCalendarsForLinkedEvents = (backend: Backends<[GoogleBackend]>) => (
	schema: Schema,
) => (savedEvent: RawRegularEventObject) =>
	collectGeneratorAsync(
		asyncIterHandler(errorGenerator('Could not handle updating sub google calendars'))(
			toAsyncIterableIterator(
				asyncIterTap<RawLinkedEvent>(linkedEvent =>
					backend
						.updateGoogleCalendars({
							...savedEvent,
							...linkedEvent,
							type: EventType.REGULAR,
						})
						.map(destroy)
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

const sendCancelEmail = (backend: Backends<[EmailBackend, MemberBackend, RegistryBackend]>) => (
	schema: Schema,
) => (account: AccountObject) => (event: RawRegularEventObject) => (updater: MemberReference) =>
	AsyncEither.All([
		getAttendanceForEvent(schema)(event),
		backend
			.getMemberName(account)(updater)
			.map(name => [
				/* getEmailText */ (url: string) => `${name} has changed the status of event ${
					event.name
				} on ${new Date(event.startDateTime).toDateString()} \
to CANCELLED.  <a href="${url}/eventviewer/${
					event.id
				}">Go here</a> to review details of the cancelled event.`,
				/* getEmailHtml */ (url: string) => `${name} has changed the status of event ${
					event.name
				} on ${new Date(event.startDateTime).toDateString()} \
to CANCELLED.  <a href="${url}/eventviewer/${
					event.id
				}">Go here</a> to review details of the cancelled event.`,
			]),
	]).flatMap(([attendance, [getEmailText, getEmailHtml]]) =>
		AsyncEither.All([
			asyncRight(
				pipe(
					asyncIterMap((record: AttendanceRecord) =>
						backend.getMember(account)(record.memberID),
					),
					asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight),
					asyncIterMap((eith: Right<Member>): string[] =>
						[
							eith.value.contact.CADETPARENTEMAIL.PRIMARY,
							eith.value.contact.CADETPARENTEMAIL.SECONDARY,
							eith.value.contact.CADETPARENTEMAIL.EMERGENCY,
							eith.value.contact.EMAIL.PRIMARY,
							eith.value.contact.EMAIL.SECONDARY,
							eith.value.contact.EMAIL.EMERGENCY,
						].filter((v): v is string => !!v),
					),
					asyncIterFlatMap(v => v),
					collectGeneratorAsync,
				)(attendance),
				errorGenerator('Could not get attendance emails'),
			),
			asyncRight(
				event.pointsOfContact
					.filter(
						(v): v is InternalPointOfContact => v.type === PointOfContactType.INTERNAL,
					)
					.map(get('email')),
				errorGenerator('Could not get Point of Contact emails'),
			),
		]).flatMap(([attendanceEmails, pocEmails]) =>
			backend
				.getRegistry(account)
				.map(backend.sendEmail)
				.flatApply(({ url }) => ({
					to: [],
					bccAddresses: [...attendanceEmails, ...pocEmails, SYSTEM_BCC_ADDRESS],
					subject: 'Event Cancellation Notice',
					textBody: getEmailText(url),
					htmlBody: getEmailHtml(url),
				})),
		),
	);

// #region Backends
export interface EventsBackend {
	getEvent: (
		account: AccountObject,
	) => (eventID: number | string) => ServerEither<FromDatabase<RawEventObject>>;
	saveEvent: (
		updater: MemberReference,
	) => (event: RawResolvedEventObject) => ServerEither<FromDatabase<RawResolvedEventObject>>;
	deleteEvent: (
		actor: MemberReference,
	) => (event: FromDatabase<RawResolvedEventObject>) => ServerEither<void>;
	fullPointsOfContact: (
		account: AccountObject,
	) => (
		records: Array<ExternalPointOfContact | InternalPointOfContact>,
	) => ServerEither<Array<ExternalPointOfContact | DisplayInternalPointOfContact>>;
	getLinkedEvents: (account: AccountObject) => (eventID: number) => AsyncIter<RawLinkedEvent>;
	getFullEventObject: (
		event: FromDatabase<RawEventObject>,
	) => ServerEither<FromDatabase<EventObject>>;
	getSourceEvent: (
		event: RawEventObject,
	) => ServerEither<MaybeObj<FromDatabase<RawRegularEventObject>>>;
	ensureResolvedEvent: (
		event: FromDatabase<RawEventObject>,
	) => ServerEither<FromDatabase<RawResolvedEventObject>>;
	createEvent: (
		account: AccountObject,
	) => (
		author: MemberReference,
	) => (data: NewEventObject) => ServerEither<FromDatabase<RawRegularEventObject>>;
	copyEvent: (
		event: RawResolvedEventObject,
	) => (
		author: MemberReference,
	) => (
		newStartTime: number,
	) => (
		newStatus: EventStatus,
	) => (copyFiles: boolean) => ServerEither<FromDatabase<RawRegularEventObject>>;
	linkEvent: (
		linkedEvent: RawEventObject,
	) => (
		linkAuthor: MemberReference,
	) => (targetAccount: AccountObject) => ServerEither<RawLinkedEvent>;
	getAudit: (
		account: AccountObject,
	) => (eventID: number | string) => ServerEither<AsyncIter<FromDatabase<EventAuditEvents>>>;
	getFullPointsOfContact: (account: AccountObject) => (records: POCRaw) => ServerEither<POCFull>;
}

export const getEventsBackend = (
	req: BasicAccountRequest,
	prevBackend: Backends<
		[EmailBackend, MemberBackend, TimeBackend, GoogleBackend, AuditsBackend, RegistryBackend]
	>,
): EventsBackend => getRequestFreeEventsBackend(req.mysqlx, { ...prevBackend, ...req.backend });

export const getRequestFreeEventsBackend = (
	mysqlx: Schema,
	prevBackend: Backends<
		[
			EmailBackend,
			MemberBackend,
			TimeBackend,
			GoogleBackend,
			AuditsBackend,
			AccountBackend,
			RegistryBackend,
		]
	>,
): EventsBackend => {
	const backend: EventsBackend = {
		getEvent: memoize((account: AccountObject) => memoize(getEvent(mysqlx)(account))),
		deleteEvent: actor => event =>
			prevBackend
				.getAccount(event.accountID)
				.flatMap(account => deleteEvent(prevBackend)(mysqlx)(account)(actor)(event)),
		fullPointsOfContact: account => records => getFullPointsOfContact(mysqlx)(account)(records),
		getLinkedEvents: account => eventID => getLinkedEvents(mysqlx)(account.id)(eventID),
		getFullEventObject: event =>
			prevBackend
				.getAccount(event.accountID)
				.flatMap(account => getFullEventObject(mysqlx)(account)(event)),
		getSourceEvent: event => getSourceEvent(mysqlx)(event),
		ensureResolvedEvent: event => newEnsureResolvedEvent({ ...prevBackend, ...backend })(event),
		getAudit: account => eventID => getAudit(mysqlx)(account)(eventID),
		getFullPointsOfContact: memoize(
			account => memoize(records => getFullPointsOfContact(mysqlx)(account)(records)),
			get('id'),
		),
		saveEvent: updater => event =>
			prevBackend.getAccount(event.accountID).flatMap(account =>
				backend
					.getEvent(account)(event.id)
					.flatMap(backend.ensureResolvedEvent)
					.flatMap(oldEvent =>
						saveEvent(prevBackend)(mysqlx)(account)(updater)(oldEvent)(event),
					),
			),
		createEvent: createEvent(prevBackend)(mysqlx),
		copyEvent: event => author => newStartTime => newStatus => copyFiles =>
			prevBackend
				.getAccount(event.accountID)
				.flatMap(account =>
					copyEvent(prevBackend)(mysqlx)(account)(event)(author)(newStartTime)(newStatus)(
						copyFiles,
					),
				),
		linkEvent: event => author => account =>
			linkEvent(prevBackend)(mysqlx)(event)(author)(account),
	};

	return backend;
};

export const getEmptyEventsBackend = (): EventsBackend => ({
	getEvent: () => () => notImplementedError('getEvent'),
	saveEvent: () => () => notImplementedError('saveEvent'),
	deleteEvent: () => () => notImplementedError('deleteEvent'),
	fullPointsOfContact: () => () => notImplementedError('fullPointsOfContact'),
	getLinkedEvents: () => () => [],
	getFullEventObject: () => notImplementedError('getFullEventObject'),
	getSourceEvent: () => notImplementedError('getSourceEvent'),
	ensureResolvedEvent: () => notImplementedError('ensureResolvedEvent'),
	createEvent: () => () => () => notImplementedError('createEvent'),
	copyEvent: () => () => () => () => () => notImplementedError('copyEvent'),
	linkEvent: () => () => () => notImplementedError('linkEvent'),
	getAudit: () => () => notImplementedError('getAudit'),
	getFullPointsOfContact: () => () => notImplementedError('getFullPointsOfContact'),
});

// #endregion
