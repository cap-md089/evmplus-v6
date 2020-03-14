import {
	api,
	AttendanceRecord,
	CustomAttendanceField,
	DebriefItem,
	DisplayInternalPointOfContact,
	EchelonEventNumber,
	either,
	EventObject,
	EventStatus,
	ExternalPointOfContact,
	MemberReference,
	MultCheckboxReturn,
	NewAttendanceRecord,
	NewEventObject,
	PointOfContactType,
	RadioReturn,
	right,
	left,
	Maybe,
	Member,
	fromValue,
	maybe
} from 'common-lib';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './MemberBase';
import { CAPMemberClasses, CAPNHQMember, CAPProspectiveMember } from './Members';

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
		if (!this.HasBasicPermission(member)) {
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

		const newEvent = either((await result.json()) as api.events.events.Add);

		return newEvent.cata(
			r => Promise.reject(r.message),
			e => Promise.resolve(new Event(e, account))
		);
	}

	public static HasBasicPermission(member: MemberBase): boolean {
		return (
			member.hasPermission('ManageEvent') ||
			((member instanceof CAPNHQMember || member instanceof CAPProspectiveMember) &&
				member.hasDutyPosition([
					'Operations Officer',
					'Cadet Operations Officer',
					'Cadet Operations NCO',
					'Activities Officer',
					'Squadron Activities Officer',
					'Cadet Activities Officer',
					'Cadet Activities NCO'
				]))
		);
	}

	public static async Get(id: number, member?: MemberBase | null, account?: Account) {
		if (!account) {
			account = await Account.Get();
		}

		const result = await account.fetch(`/api/event/${id}`, {}, member);

		const event = either((await result.json()) as api.events.events.Get);

		return event.cata(
			r => Promise.reject(r.message),
			e => Promise.resolve(new Event(e, account!))
		);
	}

	public static async EventViewerGet(id: number, member?: MemberBase | null, account?: Account) {
		if (!account) {
			account = await Account.Get();
		}

		const result = await account.fetch(`/api/event/${id}/viewer`, {}, member);

		const eventData = either((await result.json()) as api.events.events.GetEventViewerData);

		return eventData.map(data => {
			const attendees: { [key: string]: Maybe<Member> } = {};

			for (const attendee in data.attendees) {
				if (data.attendees.hasOwnProperty(attendee)) {
					attendees[attendee] = maybe(data.attendees[attendee]);
				}
			}

			return {
				organizations: data.organizations,
				event: new Event(data.event, account!),
				attendees
			};
		});
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

	public googleCalendarIds: {
		mainId: string;
		wingId: string | null;
		regId: string | null;
		feeId: string | null;
	};

	public privateAttendance: boolean;

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
		this.googleCalendarIds = data.googleCalendarIds;
		this.privateAttendance = data.privateAttendance;
		this.googleCalendarIds = data.googleCalendarIds;
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
			attendance: this.attendance,
			privateAttendance: this.privateAttendance,
			googleCalendarIds: this.googleCalendarIds
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

		const json = (await body.json()) as api.events.events.Copy;

		return either(json).cata(
			e => Promise.reject(e.message),
			e => Promise.resolve(new Event(e, this.account))
		);
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: MemberBase) {
		return (
			member.matchesReference(this.author) ||
			Event.HasBasicPermission(member) ||
			this.pointsOfContact
				.map(
					poc =>
						poc.type === PointOfContactType.INTERNAL &&
						MemberBase.AreMemberReferencesTheSame(
							member.getReference(),
							poc.memberReference
						)
				)
				.reduce((prev, curr) => prev || curr, false)
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

	public getEventURLComponent() {
		return `${this.id}-${this.name.toLocaleLowerCase().replace(/ /g, '-')}`;
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
}
