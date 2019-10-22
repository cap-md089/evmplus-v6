import APIInterface from './APIInterface';
import { EventStatus } from 'common-lib/index';
import MemberBase from './MemberBase';
import Account from './Account';
import { PointOfContactType, EchelonEventNumber } from 'common-lib/index';
import { CAPMemberClasses } from './Members';
import {
	EventObject,
	NewEventObject,
	RadioReturn,
	DisplayInternalPointOfContact,
	ExternalPointOfContact,
	MemberReference,
	AttendanceRecord,
	NewAttendanceRecord,
	MultCheckboxReturn,
	DebriefItem,
	CustomAttendanceField
} from 'common-lib';

/**
 * Represents an event for the squadron calendar
 */
export default class Event extends APIInterface<EventObject> implements EventObject {
	/**
	 * Creates an event object for the event calendar of the specified calendar
	 *
	 * @param obj The event details
	 * @param member The event author
	 * @param account The account the event belongs to
	 */
	public static async Create(obj: NewEventObject, member: MemberBase, account: Account) {
		if (!member.hasPermission('ManageEvent')) {
			throw new Error('Member cannot create event');
		}

		if (!account) {
			account = await Account.Get();
		}

		const token = await Event.getToken(account.id, member);

		const result = await account.fetch(
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

		const newEvent = await result.json();

		return new Event(newEvent, account);
	}

	public static async Get(id: number, member?: MemberBase | null, account?: Account) {
		if (!account) {
			account = await Account.Get();
		}

		const result = await account.fetch(`/api/event/${id}`, {}, member);

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

	public signUpDenyMessage: string | null;

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

	public constructor(data: EventObject, private account: Account) {
		super(account.id);

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
		this.customAttendanceFields = data.customAttendanceFields;
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
			participationFee: !!this.participationFee ? this.participationFee : null,
			pickupDateTime: this.pickupDateTime,
			pickupLocation: this.pickupLocation,
			pointsOfContact: this.pointsOfContact,
			customAttendanceFields: this.customAttendanceFields,
			publishToWingCalendar: this.publishToWingCalendar,
			registration: !!this.registration ? this.registration : null,
			regionEventNumber: this.regionEventNumber,
			requiredEquipment: this.requiredEquipment,
			requiredForms: this.requiredForms,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: !!this.signUpDenyMessage ? this.signUpDenyMessage : null,
			signUpPartTime: !!this.signUpPartTime,
			sourceEvent: !!this.sourceEvent ? this.sourceEvent : null,
			startDateTime: this.startDateTime,
			status: this.status,
			teamID: this.teamID,
			limitSignupsToTeam: this.limitSignupsToTeam,
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
		if (!member.matchesReference(memberToAdd) && !this.isPOC(member)) {
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

		this.attendance.push({
			...record,
			memberName: member.getFullName(),
			memberID: memberToAdd,
			timestamp: Date.now(),
			summaryEmailSent: false
		});

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
	}

	public async addAttendees(
		member: MemberBase,
		records: NewAttendanceRecord[],
		members: CAPMemberClasses[],
		errOnInvalidPermission = false
	) {
		if (!this.isPOC(member)) {
			if (errOnInvalidPermission) {
				throw new Error('Cannot bulk add attendance');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		const sendableRecords: NewAttendanceRecord[] = [];

		for (const i in records) {
			if (records.hasOwnProperty(i) && members.hasOwnProperty(i)) {
				sendableRecords.push({
					...records[i],
					memberID: members[i].getReference()
				});

				this.attendance.push({
					...records[i],
					memberID: members[i].getReference(),
					memberName: members[i].getFullName(),
					timestamp: Date.now(),
					summaryEmailSent: false
				});
			}
		}

		await this.fetch(
			`/api/event/${this.id}/attendance/bulk`,
			{
				body: JSON.stringify({
					members: sendableRecords,
					token
				}),
				method: 'POST'
			},
			member
		);
	}

	public async removeAttendee(
		member: MemberBase,
		memberToRemove: MemberReference,
		errOnInvalidPermission = false
	) {
		if (!this.isPOC(member)) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions for removing attendee');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

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

		this.attendance = this.attendance.filter(
			record => !MemberBase.AreMemberReferencesTheSame(record.memberID, memberToRemove)
		);
	}

	public async modifyAttendee(
		member: MemberBase,
		memberToModify: MemberReference,
		record: NewAttendanceRecord,
		errOnInvalidPermission = false
	) {
		if (!this.isPOC(member) || !member.matchesReference(memberToModify)) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions for removing attendee');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

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
		);

		let attendanceIndex = '';

		for (const i in this.attendance) {
			if (
				MemberBase.AreMemberReferencesTheSame(this.attendance[i].memberID, memberToModify)
			) {
				attendanceIndex = i;
			}
		}

		if (attendanceIndex !== '') {
			this.attendance[parseInt(attendanceIndex, 10)] = {
				...this.attendance[parseInt(attendanceIndex, 10)],
				...record
			};
		}
	}

	public async save(member: MemberBase, errOnInvalidPermission = false) {
		if (!this.isPOC(member)) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

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
		);
	}

	public async copy(
		newTime: number,
		member: MemberBase,
		copyFiles = false,
		copyStatus = false,
		errOnInvalidPermission = false
	): Promise<Event | undefined> {
		if (!this.isPOC(member)) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		const body = await this.fetch(
			`/api/event/${this.id}/copy`,
			{
				body: JSON.stringify({
					newTime,
					copyFiles,
					copyStatus,
					token
				}),
				method: 'POST'
			},
			member
		);

		const json = await body.json();

		return new Event(json, this.account);
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: MemberBase) {
		return (
			member.matchesReference(this.author) ||
			member.hasPermission('ManageEvent') ||
			this.pointsOfContact
				.map(
					poc =>
						poc.type === PointOfContactType.INTERNAL &&
						MemberBase.AreMemberReferencesTheSame(
							member.getReference(),
							poc.memberReference
						)
				)
				.reduce((prev, curr) => prev || curr)
		);
	}

	public set(values: Partial<NewEventObject>) {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				// @ts-ignore
				this[i] = values[i];
			}
		}
	}

	public async delete(member: MemberBase, errOnInvalidPermission = false) {
		if (!this.isPOC(member)) {
			if (errOnInvalidPermission) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/event/${this.id}`,
			{
				body: JSON.stringify({
					token
				}),
				method: 'DELETE'
			},
			member
		);
	}

	public hasMember(member: MemberReference): boolean {
		for (const i of this.attendance) {
			if (MemberBase.AreMemberReferencesTheSame(i.memberID, member)) {
				return true;
			}
		}

		return false;
	}

	public getEventURL() {
		return `/eventviewer/${this.id}-${this.name.toLocaleLowerCase().replace(/ /g, '-')}`;
	}

	public canSignUpForEvent(member?: MemberBase | null) {
		if (!member) {
			return false;
		}

		if (this.attendance.filter(val => member.matchesReference(val.memberID)).length !== 0) {
			return false;
		}

		if (this.teamID === null || !this.limitSignupsToTeam) {
			return true;
		}

		return member.teamIDs.indexOf(this.teamID) !== -1;
	}
}
