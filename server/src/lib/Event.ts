import { Schema } from '@mysql/xdevapi';
import {
	AttendanceRecord,
	DatabaseInterface,
	DebriefItem,
	DisplayInternalPointOfContact,
	EventObject,
	ExternalPointOfContact,
	InternalPointOfContact,
	MemberReference,
	MultCheckboxReturn,
	NewAttendanceRecord,
	NewEventObject,
	NoSQLDocument,
	RadioReturn,
	RawEventObject
} from 'common-lib';
import { EchelonEventNumber, EventStatus, PointOfContactType } from 'common-lib/index';
import { DateTime } from 'luxon';
import Account from './Account';
import { default as BaseMember, default as MemberBase } from './MemberBase';
import {
	collectResults,
	findAndBind,
	generateBindObject,
	generateFindStatement,
	generateResults
} from './MySQLUtil';
import EventValidator from './validator/validators/EventValidator';
import NewAttendanceRecordValidator from './validator/validators/NewAttendanceRecord';

type POCRaw = Array<ExternalPointOfContact | InternalPointOfContact>;
type POCFull = Array<ExternalPointOfContact | DisplayInternalPointOfContact>;

interface RawAttendanceDBRecord extends AttendanceRecord {
	accountID: string;
	eventID: number;
}

interface AlmostRaw extends RawEventObject {
	pointsOfContact: POCFull;
}

export default class Event implements EventObject, DatabaseInterface<EventObject> {
	public static Validator = new EventValidator();
	public static AttendanceValidator = new NewAttendanceRecordValidator();

	/**
	 * Get an event from the database
	 *
	 * @param id The ID of the event to get
	 * @param account The account to get the event from
	 * @param schema The schema to get the event from
	 */
	public static async Get(id: number | string, account: Account, schema: Schema) {
		if (typeof id === 'string') {
			id = parseInt(id, 10);
		}

		const eventsCollection = schema.getCollection<RawEventObject>('Events');

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
			sourceEvent: null
		};

		const results = await eventsCollection.add(newEvent).execute();

		newEvent._id = results.getGeneratedIds()[0];

		return new Event(
			{
				...newEvent,
				attendance: [] as AttendanceRecord[],
				pointsOfContact
			},
			account,
			schema
		);
	}

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
				canUsePhotos: record.canUsePhotos,
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
			internalPointsOfContact.map(p =>
				MemberBase.ResolveReference(p.memberReference, account, schema)
			)
		);

		const newPOCs = pocs as POCFull;

		newPOCs.forEach(poc => {
			if (poc.type === PointOfContactType.INTERNAL) {
				for (const mem of members) {
					if (mem.matchesReference(poc.memberReference)) {
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

	public uniform: MultCheckboxReturn;

	public desiredNumberOfParticipants: number;

	public registration: null | {
		deadline: number;
		information: string;
	};

	public participationFee: null | {
		feeDue: number;
		feeAmount: number;
	};

	public mealsDescription: MultCheckboxReturn;

	public lodgingArrangments: MultCheckboxReturn;

	public activity: MultCheckboxReturn;

	public highAdventureDescription: string;

	public requiredEquipment: string[];

	public eventWebsite: string;

	public requiredForms: MultCheckboxReturn;

	public comments: string;

	public acceptSignups: boolean;

	public signUpDenyMessage: string;

	public publishToWingCalendar: boolean;

	public showUpcoming: boolean;

	public groupEventNumber: RadioReturn<EchelonEventNumber>;

	public wingEventNumber: RadioReturn<EchelonEventNumber>;

	public regionEventNumber: RadioReturn<EchelonEventNumber>;

	public complete: boolean;

	public administrationComments: string;

	public status: EventStatus;

	public debrief: DebriefItem[];

	public pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;

	public author: MemberReference;

	public signUpPartTime: boolean;

	public teamID: number;

	public limitSignupsToTeam: boolean | null;

	public sourceEvent: null | {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

	public attendance: AttendanceRecord[];

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
	private constructor(data: EventObject, private account: Account, private schema: Schema) {
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

		await eventsCollection.replaceOne(this._id, {
			...this.toSaveRaw(),
			timeModified,
			accountID: account.id,
			pointsOfContact
		});
	}

	/**
	 * Remove the event from the database
	 */
	public async remove() {
		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		await eventsCollection
			.remove('accountID = :accountID AND id = :id')
			.bind({
				accountID: this.account.id,
				id: this.id
			})
			.execute();
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: BaseMember) {
		return (
			!!this.pointsOfContact.map(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					MemberBase.AreMemberReferencesTheSame(
						member.getReference(),
						poc.memberReference
					)
			) ||
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

		await eventsCollection.removeOne(this._id);
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<NewEventObject>): boolean {
		if (Event.Validator.validate(values, true)) {
			Event.Validator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(Event.Validator.getErrorString());
		}
	}

	/**
	 * Converts the current event to a transferable object
	 */
	public toRaw = (member?: MemberBase): EventObject => ({
		...this.toSaveRaw(),
		attendance: member === null || member === undefined ? [] : this.getAttendance()
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

	// ----------------------------------------------------
	// 					Attendance code
	// ----------------------------------------------------

	/**
	 * Returns the attendance for the event
	 */
	public getAttendance = (): AttendanceRecord[] => this.attendance.slice();

	/**
	 * Add member to attendance
	 *
	 * @param newAttendanceRecord The record to add. Contains partial details
	 * @param member The member to add to the records
	 */
	public async addMemberToAttendance(
		newAttendanceRecord: NewAttendanceRecord,
		member: BaseMember
	): Promise<boolean> {
		for (const index in this.attendance) {
			if (
				MemberBase.AreMemberReferencesTheSame(
					this.attendance[index].memberID,
					member.getReference()
				)
			) {
				return this.modifyAttendanceRecord(newAttendanceRecord, member);
			}
		}

		this.attendance = [
			...this.attendance,
			{
				comments: newAttendanceRecord.comments,
				memberID: member.getReference(),
				memberName: member.getFullName(),
				planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
				status: newAttendanceRecord.status,
				summaryEmailSent: false,
				timestamp: +DateTime.utc(),
				canUsePhotos: newAttendanceRecord.canUsePhotos,

				// If these are null, they are staying for the whole event
				arrivalTime: newAttendanceRecord.arrivalTime,
				departureTime: newAttendanceRecord.departureTime
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
				timestamp: +DateTime.utc(),
				canUsePhotos: newAttendanceRecord.canUsePhotos,

				// If these are null, they are staying for the whole event
				arrivalTime: newAttendanceRecord.arrivalTime,
				departureTime: newAttendanceRecord.departureTime,

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
		member: BaseMember
	): Promise<boolean> {
		const attendanceCollection = this.schema.getCollection<
			RawAttendanceDBRecord & Required<NoSQLDocument>
		>('Attendance');

		for (const index in this.attendance) {
			if (
				MemberBase.AreMemberReferencesTheSame(
					this.attendance[index].memberID,
					member.getReference()
				)
			) {
				const attendance = await collectResults(
					findAndBind(attendanceCollection, {
						eventID: this.id,
						accountID: this.account.id
					})
				);

				let otherIndex: string | number;

				// As far as I can tell, I have to get
				for (otherIndex in attendance) {
					if (member.matchesReference(attendance[otherIndex].memberID)) {
						break;
					}
				}

				const _id = attendance[otherIndex as number]._id;

				await attendanceCollection.replaceOne(_id, {
					_id,
					comments: newAttendanceRecord.comments,
					memberName: member.getFullName(),
					planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
					status: newAttendanceRecord.status,
					summaryEmailSent: false,
					timestamp: +DateTime.utc(),
					canUsePhotos: newAttendanceRecord.canUsePhotos,
					arrivalTime: newAttendanceRecord.arrivalTime,
					departureTime: newAttendanceRecord.departureTime,

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
					timestamp: +DateTime.utc(),
					canUsePhotos: newAttendanceRecord.canUsePhotos,

					// If these are undefined, they are staying for the whole event
					arrivalTime: newAttendanceRecord.arrivalTime,
					departureTime: newAttendanceRecord.departureTime
				};

				return true;
			}
		}

		return false;
	}

	public async removeMemberFromAttendance(member: BaseMember): Promise<AttendanceRecord[]> {
		const attendanceCollection = this.schema.getCollection<RawAttendanceDBRecord>('Attendance');

		this.attendance = this.attendance.filter(
			record => !member.matchesReference(record.memberID)
		);

		const search = {
			accountID: this.account.id,
			eventID: this.id,
			memberID: member.getReference()
		};

		await attendanceCollection
			.remove(generateFindStatement<RawAttendanceDBRecord>(search))
			.bind(generateBindObject(search))
			.execute();

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
	public addItemToDebrief = (newDebriefItem: string, member: BaseMember): DebriefItem[] =>
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
	public removeItemFromDebrief = (member: BaseMember, timeOfRecord: number): DebriefItem[] =>
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
		fileIDs: this.fileIDs
	});
}
export { EventStatus };
