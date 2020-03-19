import { Schema } from '@mysql/xdevapi';
import {
	api,
	AsyncEither,
	asyncJust,
	AsyncMaybe,
	asyncNone,
	asyncRight,
	AttendanceRecord,
	CustomAttendanceField,
	DatabaseInterface,
	DebriefItem,
	DisplayInternalPointOfContact,
	EchelonEventNumber,
	EventObject,
	EventStatus,
	ExternalPointOfContact,
	InternalPointOfContact,
	just,
	left,
	MemberReference,
	NewAttendanceRecord,
	NewEventObject,
	none,
	NoSQLDocument,
	NotificationCauseType,
	NotificationDataType,
	OtherMultCheckboxReturn,
	PointOfContactType,
	RadioReturnWithOther,
	RawEventObject,
	right
} from 'common-lib';
import { DateTime } from 'luxon';
import {
	Account,
	areMemberReferencesTheSame,
	collectResults,
	createGoogleCalendarEvents,
	EventValidator,
	findAndBind,
	generateBindObject,
	generateFindStatement,
	generateResults,
	MemberBase,
	MemberNotification,
	removeGoogleCalendarEvents,
	resolveReference,
	updateGoogleCalendars
} from './internals';
import { safeBind } from './MySQLUtil';
import { serverErrorGenerator } from './Util';

type POCRaw = Array<ExternalPointOfContact | InternalPointOfContact>;
type POCFull = Array<ExternalPointOfContact | DisplayInternalPointOfContact>;

export interface RawAttendanceDBRecord extends AttendanceRecord {
	accountID: string;
	eventID: number;
}

interface AlmostRaw extends RawEventObject {
	pointsOfContact: POCFull;
}

export default class Event implements EventObject, DatabaseInterface<EventObject> {
	/**
	 * Get an event from the database
	 *
	 * @param id The ID of the event to get
	 * @param account The account to get the event from
	 * @param schema The schema to get the event from
	 */
	public static async Get(id: number | string, account: Account, schema: Schema): Promise<Event> {
		if (typeof id === 'string') {
			id = parseInt(id, 10);
		}

		// NaN
		if (id !== id) {
			throw new Error('There was a problem getting the event');
		}

		const eventsCollection = schema.getCollection<RawEventObject & Required<NoSQLDocument>>(
			'Events'
		);

		const results = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id,
				id
			})
		);

		if (results.length !== 1) {
			throw new Error('There was a problem getting the event');
		}

		const pointsOfContact = await this.ConvertPointsOfContact(
			results[0].pointsOfContact,
			account,
			schema
		);

		const attendance = await this.GetAttendance(id, account, schema);

		return new Event(
			{
				...results[0],
				attendance,
				pointsOfContact
			},
			account,
			schema
		);
	}

	public static GetEither = (
		id: number | string,
		account: Account,
		schema: Schema
	): AsyncEither<api.ServerError, Event> =>
		asyncRight(Event.Get(id, account, schema), err =>
			err.message === 'There was a problem getting the event'
				? {
						code: 404,
						error: none<Error>(),
						message: `Could not find event specified with the id '${id}'`
				  }
				: {
						code: 500,
						error: just(err),
						message: 'Could not get the event specified'
				  }
		);

	/**
	 *
	 * @param data The new event object to create
	 * @param account The account to create an event for
	 * @param schema The schema to insert the event into
	 */
	public static async Create(
		data: NewEventObject,
		account: Account,
		schema: Schema,
		member: MemberBase
	) {
		const eventsCollection = schema.getCollection<RawEventObject>('Events');

		const idResults = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id
			})
		);

		const newID =
			1 + idResults.map(post => post.id).reduce((prev, curr) => Math.max(prev, curr), 0);

		const timeCreated = +DateTime.utc();

		const pointsOfContact = await this.ConvertPointsOfContact(
			data.pointsOfContact,
			account,
			schema
		);

		const newEvent: RawEventObject = {
			...data,
			id: newID,
			accountID: account.id,
			timeCreated,
			timeModified: timeCreated,
			author: member.getReference(),
			debrief: [],
			sourceEvent: null,
			googleCalendarIds: {
				mainId: '',
				wingId: null,
				regId: null,
				feeId: null
			}
		};

		const googleCalendarEventIds = (await createGoogleCalendarEvents(newEvent, account)) as [
			string,
			null | string,
			null | string,
			null | string
		];

		newEvent.googleCalendarIds = {
			mainId: googleCalendarEventIds[0],
			wingId: googleCalendarEventIds[1],
			regId: googleCalendarEventIds[2],
			feeId: googleCalendarEventIds[3]
		};

		const results = await eventsCollection.add(newEvent).execute();

		return new Event(
			{
				...newEvent,
				attendance: [] as AttendanceRecord[],
				pointsOfContact,
				_id: results.getGeneratedIds()[0]
			},
			account,
			schema
		);
	}

	public static CreateEither = (
		data: NewEventObject,
		account: Account,
		schema: Schema,
		member: MemberBase
	) =>
		asyncRight(
			Event.Create(data, account, schema, member),
			serverErrorGenerator('Could not create event')
		);

	private static async GetAttendance(
		id: number,
		account: Account,
		schema: Schema
	): Promise<AttendanceRecord[]> {
		const returnValue: AttendanceRecord[] = [];

		const attendanceCollection = schema.getCollection<RawAttendanceDBRecord>('Attendance');

		const generator = generateResults(
			findAndBind(attendanceCollection, {
				eventID: id,
				accountID: account.id
			})
		);

		for await (const record of generator) {
			returnValue.push({
				arrivalTime: record.arrivalTime,
				comments: record.comments,
				departureTime: record.departureTime,
				memberID: record.memberID,
				memberName: record.memberName,
				planToUseCAPTransportation: record.planToUseCAPTransportation,
				status: record.status,
				summaryEmailSent: record.summaryEmailSent,
				timestamp: record.timestamp
			});
		}

		return returnValue;
	}

	private static async ConvertPointsOfContact(
		pocs: POCRaw,
		account: Account,
		schema: Schema
	): Promise<POCFull> {
		const internalPointsOfContact = pocs.filter(
			p => p.type === PointOfContactType.INTERNAL
		) as InternalPointOfContact[];

		const members = await Promise.all(
			internalPointsOfContact.map(p => resolveReference(p.memberReference, account, schema))
		);

		const newPOCs = pocs as POCFull;

		newPOCs.forEach(poc => {
			if (poc.type === PointOfContactType.INTERNAL) {
				for (const mem of members) {
					if (mem && mem.matchesReference(poc.memberReference)) {
						poc.name = mem.getFullName();
					}
				}
			}
		});

		return newPOCs;
	}

	private static DownconvertPointsOfContact(pocs: POCFull): POCRaw {
		const newPOCs: POCRaw = [];

		pocs.forEach(poc => {
			if (poc.type === PointOfContactType.INTERNAL) {
				newPOCs.push({
					email: poc.email,
					memberReference: poc.memberReference,
					phone: poc.phone,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
					type: PointOfContactType.INTERNAL
				});
			} else {
				newPOCs.push(poc);
			}
		});

		return newPOCs;
	}

	public id: number;

	public accountID: string;

	public timeCreated: number;

	public timeModified: number;

	public name: string;

	public meetDateTime: number;

	public meetLocation: string;

	public startDateTime: number;

	public location: string;

	public endDateTime: number;

	public pickupDateTime: number;

	public pickupLocation: string;

	public transportationProvided: boolean;

	public transportationDescription: string;

	public uniform: OtherMultCheckboxReturn;

	public desiredNumberOfParticipants: number;

	public registration: null | {
		deadline: number;
		information: string;
	};

	public participationFee: null | {
		feeDue: number;
		feeAmount: number;
	};

	public mealsDescription: OtherMultCheckboxReturn;

	public lodgingArrangments: OtherMultCheckboxReturn;

	public activity: OtherMultCheckboxReturn;

	public highAdventureDescription: string;

	public requiredEquipment: string[];

	public eventWebsite: string;

	public requiredForms: OtherMultCheckboxReturn;

	public comments: string;

	public acceptSignups: boolean;

	public signUpDenyMessage: string | null;

	public publishToWingCalendar: boolean;

	public showUpcoming: boolean;

	public groupEventNumber: RadioReturnWithOther<EchelonEventNumber>;

	public wingEventNumber: RadioReturnWithOther<EchelonEventNumber>;

	public regionEventNumber: RadioReturnWithOther<EchelonEventNumber>;

	public complete: boolean;

	public administrationComments: string;

	public status: EventStatus;

	public debrief: DebriefItem[];

	public pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;

	public customAttendanceFields: CustomAttendanceField[];

	public author: MemberReference;

	public signUpPartTime: boolean;

	public teamID: number | null;

	public limitSignupsToTeam: boolean | null;

	public sourceEvent: null | {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

	public attendance: AttendanceRecord[];

	public googleCalendarIds: {
		mainId: string;
		wingId: string | null;
		regId: string | null;
		feeId: string | null;
	};

	public privateAttendance: boolean;

	// Documents require it
	// tslint:disable-next-line:variable-name
	public _id: string;

	/**
	 * Constructs an event object given the event data
	 *
	 * @param data The event object
	 * @param account The account for the event
	 * @param schema The schema for the event
	 */
	private constructor(
		data: EventObject & Required<NoSQLDocument>,
		private account: Account,
		private schema: Schema
	) {
		this.id = data.id;
		this.limitSignupsToTeam = data.limitSignupsToTeam;
		this.location = data.location;
		this.lodgingArrangments = data.lodgingArrangments;
		this.mealsDescription = data.mealsDescription;
		this.meetDateTime = data.meetDateTime;
		this.meetLocation = data.meetLocation;
		this.name = data.name;
		this.participationFee = data.participationFee;
		this.pickupDateTime = data.pickupDateTime;
		this.pickupLocation = data.pickupLocation;
		this.pointsOfContact = data.pointsOfContact;
		this.publishToWingCalendar = data.publishToWingCalendar;
		this.regionEventNumber = data.regionEventNumber;
		this.registration = data.registration;
		this.requiredEquipment = data.requiredEquipment;
		this.requiredForms = data.requiredForms;
		this.showUpcoming = data.showUpcoming;
		this.signUpDenyMessage = data.signUpDenyMessage;
		this.signUpPartTime = data.signUpPartTime;
		this.sourceEvent = data.sourceEvent;
		this.startDateTime = data.startDateTime;
		this.status = data.status;
		this.teamID = data.teamID;
		this.timeCreated = data.timeCreated;
		this.timeModified = data.timeModified;
		this.transportationDescription = data.transportationDescription;
		this.transportationProvided = data.transportationProvided;
		this.uniform = data.uniform;
		this.wingEventNumber = data.wingEventNumber;
		this.fileIDs = data.fileIDs;
		this.attendance = data.attendance;
		this.administrationComments = data.administrationComments;
		this.activity = data.activity;
		this.acceptSignups = data.acceptSignups;
		this.accountID = data.accountID;
		this.author = data.author;
		this.comments = data.comments;
		this.complete = data.complete;
		this.debrief = data.debrief;
		this.desiredNumberOfParticipants = data.desiredNumberOfParticipants;
		this.endDateTime = data.endDateTime;
		this.eventWebsite = data.eventWebsite;
		this.groupEventNumber = data.groupEventNumber;
		this.highAdventureDescription = data.highAdventureDescription;
		this.customAttendanceFields = data.customAttendanceFields;
		this.googleCalendarIds = data.googleCalendarIds;
		this.privateAttendance = data.privateAttendance;

		this._id = data._id;
	}

	/**
	 * Saves the event to the database
	 *
	 * @param {Account} account The account to save it to. If not provided,
	 * 		it uses the account ID the object was created with
	 */
	public async save(account: Account = this.account) {
		const timeModified = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<RawEventObject>('Events');

		const pointsOfContact = Event.DownconvertPointsOfContact(this.pointsOfContact);

		this.timeModified = timeModified;

		const googleCalendarEventIds = (await updateGoogleCalendars(this, account)) as [
			string,
			null | string,
			null | string,
			null | string
		];

		await eventsCollection.replaceOne(this._id, {
			...this.toSaveRaw(),
			timeModified,
			accountID: account.id,
			googleCalendarIds: {
				mainId: googleCalendarEventIds[0],
				wingId: googleCalendarEventIds[1],
				regId: googleCalendarEventIds[2],
				feeId: googleCalendarEventIds[3]
			},
			pointsOfContact
		});
	}

	/**
	 * Remove the event from the database
	 */
	public async remove() {
		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		removeGoogleCalendarEvents(this, this.account);

		await safeBind(eventsCollection.remove('accountID = :accountID AND id = :id'), {
			accountID: this.account.id,
			id: this.id
		}).execute();
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: MemberBase) {
		return (
			!!this.pointsOfContact
				.map(
					poc =>
						poc.type === PointOfContactType.INTERNAL &&
						areMemberReferencesTheSame(member.getReference(), poc.memberReference)
				)
				.reduce((prev, curr) => prev || curr, false) ||
			member.matchesReference(this.author) ||
			member.isRioux
		);
	}

	/**
	 * Copies the event in such a way as to preserve all information except time,
	 * 	which is modified to preserve the deltas but start at the specified date time
	 *
	 * @param newStartTime The start time of the new event
	 */
	public copy(
		newStartTime: DateTime,
		member: MemberBase,
		copyStatus = false,
		copyFiles = true
	): Promise<Event> {
		const timeDelta = +newStartTime - this.startDateTime;

		const newEvent: NewEventObject = {
			acceptSignups: this.acceptSignups,
			activity: this.activity,
			administrationComments: this.administrationComments,
			comments: this.comments,
			complete: this.complete,
			desiredNumberOfParticipants: this.desiredNumberOfParticipants,
			eventWebsite: this.eventWebsite,
			groupEventNumber: this.groupEventNumber,
			highAdventureDescription: this.highAdventureDescription,
			location: this.location,
			lodgingArrangments: this.lodgingArrangments,
			mealsDescription: this.mealsDescription,
			meetLocation: this.meetLocation,
			name: this.name,
			participationFee: this.participationFee,
			pickupLocation: this.pickupLocation,
			pointsOfContact: this.pointsOfContact,
			customAttendanceFields: this.customAttendanceFields,
			publishToWingCalendar: this.publishToWingCalendar,
			regionEventNumber: this.regionEventNumber,
			registration: this.registration,
			requiredEquipment: this.requiredEquipment,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: this.signUpDenyMessage,
			signUpPartTime: this.signUpPartTime,
			requiredForms: this.requiredForms,
			fileIDs: copyFiles ? this.fileIDs : [],
			status: copyStatus ? this.status : EventStatus.INFORMATIONONLY,
			teamID: this.teamID,
			limitSignupsToTeam: this.limitSignupsToTeam,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,
			privateAttendance: this.privateAttendance,

			meetDateTime: this.meetDateTime + timeDelta,
			startDateTime: this.startDateTime + timeDelta,
			endDateTime: this.endDateTime + timeDelta,
			pickupDateTime: this.pickupDateTime + timeDelta
		};

		return Event.Create(newEvent, this.account, this.schema, member);
	}

	/**
	 * Links the event to another account
	 *
	 * @param targetAccount The account to link to
	 * @param member The member linking the event
	 */
	public async linkTo(targetAccount: Account, member: MemberBase): Promise<Event> {
		const linkedEvent = await Event.Create(this.toRaw(), targetAccount, this.schema, member);

		linkedEvent.sourceEvent = {
			accountID: this.account.id,
			id: this.id
		};

		await linkedEvent.save();

		return linkedEvent;
	}

	/**
	 * Deletes the current event
	 */
	public async delete(): Promise<void> {
		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		removeGoogleCalendarEvents(this, this.account);

		await eventsCollection.removeOne(this._id);
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public async set(
		values: Partial<NewEventObject>,
		account: Account,
		schema: Schema,
		updater: MemberBase
	): Promise<boolean> {
		const registry = await account.getRegistry();

		if (EventValidator.validate(values, true)) {
			if (values.pointsOfContact) {
				const previousPOCs = this.pointsOfContact.slice(0);
				const newPOCs = values.pointsOfContact.slice(0);

				for (let i: number = newPOCs.length - 1; i >= 0; i--) {
					for (const poc of this.pointsOfContact) {
						const pPOC = newPOCs[i];
						if (pPOC.type === PointOfContactType.EXTERNAL) {
							newPOCs.splice(i, 1);
							continue;
						}

						if (
							poc.type === PointOfContactType.INTERNAL &&
							areMemberReferencesTheSame(poc.memberReference, pPOC.memberReference)
						) {
							newPOCs.splice(i, 1);
						}
					}
				}

				for (let i: number = previousPOCs.length - 1; i >= 0; i--) {
					for (const poc of values.pointsOfContact) {
						const pPOC = previousPOCs[i];
						if (pPOC.type === PointOfContactType.EXTERNAL) {
							previousPOCs.splice(i, 1);
							continue;
						}

						if (
							poc.type === PointOfContactType.INTERNAL &&
							areMemberReferencesTheSame(poc.memberReference, pPOC.memberReference)
						) {
							previousPOCs.splice(i, 1);
						}
					}
				}

				for (const poc of previousPOCs) {
					await MemberNotification.CreateNotification(
						'You are no longer a POC of an event',
						(poc as DisplayInternalPointOfContact).memberReference,
						{
							type: NotificationCauseType.MEMBER,
							from: updater.getReference()
						},
						{
							type: NotificationDataType.EVENT,

							accountID: this.accountID,
							eventID: this.id,
							delta: 'REMOVED',
							eventName: this.name
						},
						account,
						schema,
						registry,
						updater
					);
				}

				for (const poc of newPOCs) {
					await MemberNotification.CreateNotification(
						'You are now a POC of an event',
						(poc as DisplayInternalPointOfContact).memberReference,
						{
							type: NotificationCauseType.MEMBER,
							from: updater.getReference()
						},
						{
							type: NotificationDataType.EVENT,

							accountID: this.accountID,
							eventID: this.id,
							delta: 'ADDED',
							eventName: this.name
						},
						account,
						schema,
						registry,
						updater
					);
				}
			}

			EventValidator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(EventValidator.getErrorString());
		}
	}

	/**
	 * Converts the current event to a transferable object
	 */
	public toRaw = (member?: MemberBase | null): EventObject => ({
		...this.toSaveRaw(),
		attendance:
			member === null || member === undefined
				? []
				: this.privateAttendance
				? this.isPOC(member)
					? this.getAttendance()
					: []
				: this.getAttendance()
	});

	/**
	 * toRaw conditionally provides the attendance based on parameters
	 *
	 * This method returns the full, raw object unconditionally
	 */
	public toFullRaw = (): EventObject => ({
		...this.toRaw(),
		attendance: this.getAttendance(),
		limitSignupsToTeam: this.limitSignupsToTeam
	});

	public async getSourceEvent(): Promise<Event> {
		if (this.sourceEvent === null) {
			return Promise.reject('There is no source event');
		}

		const sourceAccount = await Account.Get(this.sourceEvent.accountID, this.schema);

		return Event.Get(this.sourceEvent.id, sourceAccount, this.schema);
	}

	public getMaybeSourceEvent(): AsyncMaybe<Event> {
		if (this.sourceEvent === null) {
			return asyncNone();
		}

		const id = this.sourceEvent.id;

		return asyncJust(Account.Get(this.sourceEvent.accountID, this.schema)).map(account =>
			Event.Get(id, account, this.schema)
		);
	}

	public canSignUpForEvent(member?: MemberBase | null) {
		return right<string, void>(void 0)
			.flatMap(v =>
				!!member
					? right(member)
					: left<string, MemberBase>('Cannot sign up without being signed in')
			)
			.flatMap(v =>
				this.attendance.filter(val => v.matchesReference(val.memberID)).length === 0
					? right(v)
					: left<string, MemberBase>('Member is already in attendance')
			)
			.flatMap(v =>
				this.acceptSignups
					? right(v)
					: left<string, MemberBase>(
							this.signUpDenyMessage || 'Sign ups are not allowed for this event'
					  )
			)
			.flatMap(v =>
				this.teamID !== null && this.limitSignupsToTeam
					? v.teamIDs.indexOf(this.teamID) !== -1
						? right(v)
						: left<string, MemberBase>('Member is required to be a part of the team')
					: right(v)
			)
			.flatMap(v =>
				this.registration !== null
					? this.registration.deadline > +new Date()
						? right(v)
						: left<string, MemberBase>(
								'Cannot sign up for event after the event deadline'
						  )
					: right(v)
			)
			.map(() => void 0);
	}

	// ----------------------------------------------------
	// 					Attendance code
	// ----------------------------------------------------

	/**
	 * Returns the attendance for the event
	 */
	public getAttendance = (): AttendanceRecord[] => this.attendance.slice();

	/**
	 * Checks for the sepcified member
	 */
	public hasMemberInAttendance = (member: MemberReference) =>
		this.attendance.find(val => areMemberReferencesTheSame(member, val.memberID)) !== undefined;

	/**
	 * Gets the records for a member
	 */
	public getAttendanceRecordForMember = (member: MemberReference): AttendanceRecord | undefined =>
		this.attendance.find(val => areMemberReferencesTheSame(member, val.memberID));

	/**
	 * Add member to attendance
	 *
	 * @param newAttendanceRecord The record to add. Contains partial details
	 * @param member The member to add to the records
	 */
	public async addMemberToAttendance(
		newAttendanceRecord: NewAttendanceRecord,
		member: MemberBase
	): Promise<boolean> {
		for (const index in this.attendance) {
			if (
				areMemberReferencesTheSame(this.attendance[index].memberID, member.getReference())
			) {
				return this.modifyAttendanceRecord(newAttendanceRecord, member);
			}
		}

		const timestamp = +DateTime.utc();

		this.attendance = [
			...this.attendance,
			{
				comments: newAttendanceRecord.comments,
				memberID: member.getReference(),
				memberName: member.getFullName(),
				planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
				status: newAttendanceRecord.status,
				summaryEmailSent: false,
				timestamp,

				// If these are null, they are staying for the whole event
				arrivalTime: newAttendanceRecord.arrivalTime || this.startDateTime,
				departureTime: newAttendanceRecord.departureTime || this.endDateTime
			}
		];

		const attendanceCollection = this.schema.getCollection<RawAttendanceDBRecord>('Attendance');

		await attendanceCollection
			.add({
				comments: newAttendanceRecord.comments,
				memberID: member.getReference(),
				memberName: member.getFullName(),
				planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
				status: newAttendanceRecord.status,
				summaryEmailSent: false,
				timestamp,

				// If these are null, they are staying for the whole event
				arrivalTime: newAttendanceRecord.arrivalTime || this.startDateTime,
				departureTime: newAttendanceRecord.departureTime || this.endDateTime,

				accountID: this.account.id,
				eventID: this.id
			})
			.execute();

		return true;
	}

	/**
	 * Modifies a current attendance record
	 *
	 * @param newAttendanceRecord The record to set
	 * @param member The member to modify for
	 */
	public async modifyAttendanceRecord(
		newAttendanceRecord: NewAttendanceRecord,
		member: MemberBase
	): Promise<boolean> {
		const attendanceCollection = this.schema.getCollection<
			RawAttendanceDBRecord & Required<NoSQLDocument>
		>('Attendance');

		for (const index in this.attendance) {
			if (
				areMemberReferencesTheSame(this.attendance[index].memberID, member.getReference())
			) {
				const attendance = await collectResults(
					findAndBind(attendanceCollection, {
						eventID: this.id,
						accountID: this.account.id
					})
				);

				// tslint:disable-next-line:variable-name
				let _id: string | null = null;

				// As far as I can tell, I have to get the _id of the document
				for (const otherIndex in attendance) {
					if (member.matchesReference(attendance[otherIndex].memberID)) {
						_id = attendance[otherIndex]._id;
					}
				}

				if (_id) {
					const timestamp = +DateTime.utc();

					await attendanceCollection.replaceOne(_id, {
						_id,
						comments: newAttendanceRecord.comments,
						memberName: member.getFullName(),
						planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
						status: newAttendanceRecord.status,
						summaryEmailSent: false,
						timestamp,
						arrivalTime: newAttendanceRecord.arrivalTime || this.startDateTime,
						departureTime: newAttendanceRecord.departureTime || this.endDateTime,

						accountID: this.account.id,
						eventID: this.id,
						memberID: member.getReference()
					});

					this.attendance[index] = {
						comments: newAttendanceRecord.comments,
						memberID: member.getReference(),
						memberName: member.getFullName(),
						planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
						status: newAttendanceRecord.status,
						summaryEmailSent: false,
						timestamp,

						// If these are undefined, they are staying for the whole event
						arrivalTime: newAttendanceRecord.arrivalTime || this.startDateTime,
						departureTime: newAttendanceRecord.departureTime || this.endDateTime
					};
				} else {
					return false;
				}

				return true;
			}
		}

		return false;
	}

	public async removeMemberFromAttendance(member: MemberBase): Promise<AttendanceRecord[]> {
		const attendanceCollection = this.schema.getCollection<RawAttendanceDBRecord>('Attendance');

		this.attendance = this.attendance.filter(
			record => !member.matchesReference(record.memberID)
		);

		const search = {
			accountID: this.account.id,
			eventID: this.id,
			memberID: member.getReference()
		};

		await safeBind(
			attendanceCollection.remove(generateFindStatement<RawAttendanceDBRecord>(search)),
			generateBindObject(search)
		).execute();

		return this.attendance;
	}

	// ----------------------------------------------------
	// 					Debrief code
	// ----------------------------------------------------

	/**
	 * Returns the debriefs for the event
	 */
	public getDebriefs = (): DebriefItem[] => this.debrief.slice();

	/**
	 * Add item to debrief
	 *
	 * @param newDebriefItem The text of the record to add
	 * @param member The member to add to the records
	 */
	public addItemToDebrief = (newDebriefItem: string, member: MemberBase): DebriefItem[] =>
		(this.debrief = [
			...this.debrief,
			{
				memberRef: member.getReference(),
				timeSubmitted: +DateTime.utc(),
				debriefText: newDebriefItem
			}
		]);

	/**
	 * Removes a debrief item
	 *
	 * @param member The member who submitted the debrief item
	 * @param timeSubmitted The time the member submitted it
	 */
	public removeItemFromDebrief = (member: MemberBase, timeOfRecord: number): DebriefItem[] =>
		(this.debrief = this.debrief.filter(
			record =>
				!(
					member.matchesReference(record.memberRef) &&
					timeOfRecord === record.timeSubmitted
				)
		));

	private toSaveRaw = (): AlmostRaw => ({
		id: this.id,
		accountID: this.accountID,
		acceptSignups: this.acceptSignups,
		activity: this.activity,
		administrationComments: this.administrationComments,
		author: this.author,
		comments: this.comments,
		complete: this.complete,
		debrief: this.debrief,
		desiredNumberOfParticipants: this.desiredNumberOfParticipants,
		endDateTime: this.endDateTime,
		eventWebsite: this.eventWebsite,
		groupEventNumber: this.groupEventNumber,
		highAdventureDescription: this.highAdventureDescription,
		location: this.location,
		lodgingArrangments: this.lodgingArrangments,
		mealsDescription: this.mealsDescription,
		meetDateTime: this.meetDateTime,
		meetLocation: this.meetLocation,
		name: this.name,
		participationFee: !!this.participationFee ? this.participationFee : null,
		pickupDateTime: this.pickupDateTime,
		pickupLocation: this.pickupLocation,
		pointsOfContact: this.pointsOfContact,
		customAttendanceFields: this.customAttendanceFields,
		publishToWingCalendar: this.publishToWingCalendar,
		regionEventNumber: this.regionEventNumber,
		registration: !!this.registration ? this.registration : null,
		requiredEquipment: this.requiredEquipment,
		requiredForms: this.requiredForms,
		showUpcoming: this.showUpcoming,
		signUpDenyMessage: !!this.signUpDenyMessage ? this.signUpDenyMessage : null,
		signUpPartTime: !!this.signUpPartTime,
		sourceEvent: !!this.sourceEvent ? this.sourceEvent : null,
		startDateTime: this.startDateTime,
		status: this.status,
		teamID: this.teamID,
		limitSignupsToTeam: this.teamID !== null ? this.limitSignupsToTeam : null,
		timeCreated: this.timeCreated,
		timeModified: this.timeModified,
		transportationDescription: this.transportationDescription,
		transportationProvided: this.transportationProvided,
		uniform: this.uniform,
		wingEventNumber: this.wingEventNumber,
		fileIDs: this.fileIDs,
		googleCalendarIds: this.googleCalendarIds,
		privateAttendance: this.privateAttendance
	});
}
export { EventStatus };
