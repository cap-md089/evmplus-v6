import APIInterface from './APIInterface';
import { EventStatus } from '../enums';
import MemberBase from './MemberBase';
import Account from './Account';
import { PointOfContactType } from '../enums';
import { EchelonEventNumber } from '../../../lib';

/**
 * Represents an event for the squadron calendar
 */
export default class Event extends APIInterface<EventObject>
	implements EventObject {
	/**
	 * Creates an event object for the event calendar of the specified calendar
	 * 
	 * @param obj The event details
	 * @param member The event author
	 * @param account The account the event belongs to
	 */
	public static async Create(
		obj: NewEventObject,
		member: MemberBase,
		account: Account
	) {
		if (!member.hasPermission('AddEvent')) {
			throw new Error('Member cannot create event');
		}

		if (!account) {
			account = await Account.Get();
		}

		const token = await Event.getToken(account.id, member);

		let result;
		try {
			result = await account.fetch(
				'/api/event',
				{
					body: JSON.stringify({
						...obj,
						token
					}),
					method: 'POST'
				},
				member
			);
		} catch (e) {
			throw new Error('Could not create new event');
		}

		const newEvent = await result.json();

		return new Event(newEvent, account);
	}

	public static async Get(
		id: number,
		member?: MemberBase | null,
		account?: Account
	) {
		if (!account) {
			account = await Account.Get();
		}

		let result;
		try {
			result = await account.fetch(`/api/event/${id}`, {}, member);
		} catch (e) {
			throw new Error('Could not get event');
		}

		const event = await result.json();

		return new Event(event, account);
	}

	public id: number;

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

	public pointsOfContact: Array<
		DisplayInternalPointOfContact | ExternalPointOfContact
	>;

	public author: MemberReference;

	public signUpPartTime: boolean;

	public teamID: number;

	public sourceEvent: null | {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

	public attendance: AttendanceRecord[];

	public constructor(data: EventObject, account: Account) {
		super(account.id);

		Object.assign(this, data);
	}

	public toRaw(): EventObject {
		return {
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
			participationFee: !!this.participationFee
				? this.participationFee
				: null,
			pickupDateTime: this.pickupDateTime,
			pickupLocation: this.pickupLocation,
			pointsOfContact: this.pointsOfContact,
			publishToWingCalendar: this.publishToWingCalendar,
			registration: !!this.registration ? this.registration : null,
			regionEventNumber: this.regionEventNumber,
			requiredEquipment: this.requiredEquipment,
			requiredForms: this.requiredForms,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: !!this.signUpDenyMessage
				? this.signUpDenyMessage
				: null,
			signUpPartTime: !!this.signUpPartTime,
			sourceEvent: !!this.sourceEvent ? this.sourceEvent : null,
			startDateTime: this.startDateTime,
			status: this.status,
			teamID: this.teamID,
			timeCreated: this.timeCreated,
			timeModified: this.timeModified,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,
			fileIDs: this.fileIDs,
			attendance: this.attendance
		};
	}

	public async addAttendee(
		member: MemberBase,
		memberToAdd: MemberReference,
		record: NewAttendanceRecord,
		errOnInvalidPermission = false
	) {
		if (
			!member.matchesReference(memberToAdd) &&
			!this.isPOC(member)
		) {
			if (errOnInvalidPermission) {
				throw new Error('Cannot add someone else');
			} else {
				memberToAdd = member.getReference();
			}
		}

		const body: NewAttendanceRecord & { member?: MemberReference } = record;

		if (!member.matchesReference(memberToAdd)) {
			body.member = memberToAdd;
		}

		const token = await this.getToken(member);

		try {
			await this.fetch(
				`/api/event/${this.id}/attendance`,
				{
					body: JSON.stringify({
						...body,
						token
					}),
					method: 'POST'
				},
				member
			);
		} catch(e) {
			throw new Error('Could not add attendee');
		}
	}

	public async removeAttendee(
		member: MemberBase,
		memberToRemove: MemberReference,
		errOnInvalidPermission = false
	) {
		if (
			!this.isPOC(member)
		) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions for removing attendee');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		try {
			await this.fetch(
				`/api/event/${this.id}/attendance`,
				{
					body: JSON.stringify({
						...memberToRemove,
						token
					}),
					method: 'DELETE'
				},
				member
			);
		} catch(e) {
			throw new Error('Could not delete attendee');
		}
	}

	public async modifyAttendee(
		member: MemberBase,
		memberToModify: MemberReference,
		record: NewAttendanceRecord,
		errOnInvalidPermission = false
	) {
		if (
			!this.isPOC(member) ||
			!member.matchesReference(memberToModify)
		) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions for removing attendee');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		try {
			await this.fetch(
				`/api/event/${this.id}/attendance`,
				{
					body: JSON.stringify({
						...record,
						member: memberToModify,
						token
					}),
					method: 'PUT'
				},
				member
			)
		} catch(e) {
			throw new Error('Could not modify attendance record');
		}
	}

	public async save(member: MemberBase, errOnInvalidPermission = false) {
		if (
			!this.isPOC(member)
		) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		try {
			await this.fetch(
				`/api/event/${this.id}`,
				{
					body: JSON.stringify({
						...this.toRaw(),
						token
					}),
					method: 'PUT'
				},
				member
			)
		} catch(e) {
			throw new Error('Could not save event');
		}
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: MemberBase) {
		return (
			this.pointsOfContact.map(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					MemberBase.AreMemberReferencesTheSame(
						member.getReference(),
						poc.memberReference
					)
			) ||
			member.matchesReference(this.author) ||
			member.hasPermission('SignUpEdit')
		);
	}

	public set(values: Partial<NewEventObject>) {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				this[i] = values[i];
			}
		}
	}
}