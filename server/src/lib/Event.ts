import { Schema } from '@mysql/xdevapi';
import { EventStatus, PointOfContactType } from 'common-lib/index';
import { DateTime } from 'luxon';
import Account from './Account';
import BaseMember from './MemberBase';
import { collectResults, findAndBind } from './MySQLUtil';

export default class Event implements EventObject {
	/**
	 * Get an event from the database
	 *
	 * @param id The ID of the event to get
	 * @param account The account to get the event from
	 * @param schema The schema to get the event from
	 */
	public static async Get(id: number, account: Account, schema: Schema) {
		const eventsCollection = schema.getCollection<EventObject>('Events');

		const results = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id,
				id
			})
		);

		if (results.length !== 1) {
			throw new Error('There was a problem getting the event');
		}

		return new Event(results[0], account, schema);
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
		schema: Schema
	) {
		const eventsCollection = schema.getCollection<EventObject>('Events');

		const idResults = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id
			})
		);

		const newID =
			1 +
			idResults
				.map(post => post.id)
				.reduce((prev, curr) => Math.max(prev, curr), 0);

		const timeCreated = Math.round(+DateTime.utc() / 1000);

		const newEvent: EventObject = {
			...data,
			id: newID,
			accountID: account.id,
			timeCreated,
			timeModified: timeCreated
		};

		const results = await eventsCollection.add(newEvent).execute();

		newEvent._id = results.getGeneratedIds()[0];

		return new Event(newEvent, account, schema);
	}

	public id: number = 0;

	public accountID: string = '';

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

	public registration?: {
		deadline: number;
		information: string;
	};

	public participationFee?: {
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

	public groupEventNumber: [number, string];

	public wingEventNumber: number;

	public complete: boolean;

	public administrationComments: string;

	public status: EventStatus;

	public debrief: string;

	public pointsOfContact: Array<
		InternalPointOfContact | ExternalPointOfContact
	>;

	public author: number;

	public signUpPartTime: boolean;

	public teamID: number;

	public sourceEvent?: {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

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
		data: EventObject,
		private account: Account,
		private schema: Schema
	) {
		Object.assign(this, data);
	}

	/**
	 * Saves the event to the database
	 *
	 * @param {Account} account The account to save it to. If not provided,
	 * 		it uses the account ID the object was created with
	 */
	public async save(account: Account = this.account) {
		const timeModified = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

		await eventsCollection.replaceOne(this._id, {
			...this.toRaw(),
			timeModified,
			accountID: account.id
		});
	}

	/**
	 * Save a copy of the event to database
	 *
	 * @param {Account} account The account to save to
	 */
	public async saveCopy(account: Account) {
		const timeCreated = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

		await eventsCollection.add({
			...this.toRaw(),
			timeCreated,
			timeModified: timeCreated,
			accountID: account.id
		});
	}

	/**
	 * Remove the event from the database
	 */
	public async remove() {
		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

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
			this.pointsOfContact.map(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					poc.id === member.id
			) &&
			member.id === this.author &&
			member.isRioux
		);
	}

	/**
	 * Copies the event in such a way as to preserve all information except time,
	 * 	which is modified to preserve the deltas but start at the specified date time
	 * 
	 * @param newStartTime The start time of the new event
	 */
	public copy(newStartTime: DateTime, copyStatus = false, copyFiles = true): Promise<Event> {
		const timeDelta = +newStartTime - this.startDateTime;

		const timeCreated = +DateTime.utc();

		const newEvent: NewEventObject = {
			acceptSignups: this.acceptSignups,
			activity: this.activity,
			administrationComments: this.administrationComments,
			author: this.author,
			comments: this.comments,
			complete: this.complete,
			debrief: this.debrief,
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
			registration: this.registration,
			requiredEquipment: this.requiredEquipment,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: this.signUpDenyMessage,
			signUpPartTime: this.signUpPartTime,
			requiredForms: this.requiredForms,
			fileIDs: copyFiles ? this.fileIDs : [],
			status: copyStatus ? this.status : EventStatus.INFORMATIONONLY,
			teamID: this.teamID,
			timeCreated,
			timeModified: timeCreated,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,

			meetDateTime: this.meetDateTime - timeDelta,
			startDateTime: this.startDateTime - timeDelta,
			endDateTime: this.endDateTime - timeDelta,
			pickupDateTime: this.pickupDateTime - timeDelta
		};

		return Event.Create(newEvent, this.account, this.schema);
	}

	/**
	 * Converts the current event to a transferable object
	 */
	public toRaw(): EventObject {
		return {
			_id: this._id,
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
			participationFee: this.participationFee,
			pickupDateTime: this.pickupDateTime,
			pickupLocation: this.pickupLocation,
			pointsOfContact: this.pointsOfContact,
			publishToWingCalendar: this.publishToWingCalendar,
			registration: this.registration,
			requiredEquipment: this.requiredEquipment,
			requiredForms: this.requiredForms,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: this.signUpDenyMessage,
			signUpPartTime: this.signUpPartTime,
			sourceEvent: this.sourceEvent,
			startDateTime: this.startDateTime,
			status: this.status,
			teamID: this.teamID,
			timeCreated: this.timeCreated,
			timeModified: this.timeModified,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,
			fileIDs: this.fileIDs
		};
	}
}

export { EventStatus };

