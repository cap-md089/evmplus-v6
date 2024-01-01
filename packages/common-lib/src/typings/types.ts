/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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

import type { Schema, Session } from '@mysql/xdevapi';
import type { EventEmitter } from 'events';
import type { IncomingHttpHeaders } from 'http';
import type { MaybeObj } from '../lib/Maybe';

import * as NHQ from './nhq/index';
import {
	CAPMemberContact,
	CadetAprvStatus,
	CAPMemberContactType,
	CAPMemberContactPriority,
} from './nhq/index';
export { CAPMemberContact, CadetAprvStatus, CAPMemberContactType, CAPMemberContactPriority, NHQ };

export enum EventStatus {
	DRAFT = 'Draft',
	TENTATIVE = 'Tentative',
	CONFIRMED = 'Confirmed',
	COMPLETE = 'Complete',
	CANCELLED = 'Cancelled',
	INFORMATIONONLY = 'InformationOnly',
}

export enum EchelonEventNumber {
	NOT_REQUIRED = 0,
	TO_BE_APPLIED_FOR = 1,
	APPLIED_FOR = 2,
	DENIED = 3,
	APPROVED = 4,
}

export enum MemberCreateError {
	NONE = 'None',
	INCORRRECT_CREDENTIALS = 'IncorrectCredentials',
	SERVER_ERROR = 'ServerError',
	PASSWORD_EXPIRED = 'PasswordExpired',
	INVALID_SESSION_ID = 'InvalidSessionID',
	RECAPTCHA_INVALID = 'TokenInvalid',
	UNKOWN_SERVER_ERROR = 'UnknownServerError',
	DATABASE_ERROR = 'DatabaseError',
	ACCOUNT_USES_MFA = 'MFAChallengeRequired',
	ACCOUNT_EXPIRED = 'AccountExpired',
}

export enum PointOfContactType {
	INTERNAL = 'Internal',
	EXTERNAL = 'External',
}

export enum TeamPublicity {
	PRIVATE = 'Private', // Nothing visible, not shown on Browse unless signed in and member of team
	// Names are visible to those signed in
	PROTECTED = 'Protected', // Names and contact information available to those who sign in
	PUBLIC = 'Public', // Names shown to those who sign in
}

export enum CAPProspectiveMemberPasswordCreationType {
	WITHPASSWORD = 'WithPassword',
	EMAILLINK = 'EmailLink',
	RANDOMPASSWORD = 'RandomPassword',
}

export enum MemberCAPWATCHErrors {
	INVALID_PERMISSIONS = 'InvalidPermissions',
	NO_NHQ_ACTION = 'NoNHQAction',
}

export enum CAPWATCHImportErrors {
	NONE = 'None',
	BADDATA = 'BadData',
	INSERT = 'BadInsert',
	CLEAR = 'BadClear',
	NOPERMISSIONS = 'BadPerms',
}

export enum AttendanceStatus {
	COMMITTEDATTENDED = 'CommittedAttended',
	NOSHOW = 'NoShow',
	RESCINDEDCOMMITMENTTOATTEND = 'RescindedCommitment',
	NOTPLANNINGTOATTEND = 'NotPlanningToAttend',
}

export enum AuditableEventType {
	MODIFY = 'Modify',
	ADD = 'Add',
	DELETE = 'Delete',
}

// http://www.ntfs.com/ntfs-permissions-file-folder.htm
export enum FileUserAccessControlPermissions {
	// Read for a folder includes the ability to see files inside of it
	READ = 1,
	// eslint-disable-next-line no-bitwise
	WRITE = 1 << 1,
	// Modify, for folders, means changing name and uploading files
	// eslint-disable-next-line no-bitwise
	MODIFY = 1 << 2,
	FULLCONTROL = 255,
}

export enum FileUserAccessControlType {
	USER = 'User',
	TEAM = 'Team',
	ACCOUNTMEMBER = 'AccountMember',
	SIGNEDIN = 'SignedIn',
	OTHER = 'Public',
}

// For some reason MySQL doesn't like 0...
export enum NotificationTargetType {
	MEMBER = 'Member',
	ADMINS = 'Admins',
	EVERYONE = 'Everyone',
}

// For some reason MySQL doesn't like 0...
export enum NotificationCauseType {
	MEMBER = 'Member',
	SYSTEM = 'System',
}

export enum NotificationDataType {
	PROSPECTIVEMEMBER = 'ProspectiveMember',
	PERSONNELFILES = 'PersonnelFiles',
	EVENT = 'Event',
	PERMISSIONCHANGE = 'PermissionChange',
	MESSAGE = 'Message',
}

export enum CustomAttendanceFieldEntryType {
	TEXT = 'Text',
	NUMBER = 'Number',
	DATE = 'Date',
	CHECKBOX = 'Checkbox',
	FILE = 'File',
}

export enum CAPWATCHImportUpdate {
	CAPWATCHFileDownloaded = 'Downloaded',
	FileImported = 'Imported',
	CAPWATCHFileDone = 'Done',
	ProgressInitialization = 'Init',
}

export enum PasswordResult {
	VALID = 'Valid',
	VALID_EXPIRED = 'Expired',
	INVALID = 'Invalid',
}

export enum PasswordSetResult {
	OK = 'Ok',
	IN_HISTORY = 'InHistory',
	COMPLEXITY = 'Complexity',
	MIN_AGE = 'MinimumAge',
	SERVER_ERROR = 'ServerError',
}

export enum EmailSentType {
	TOPARENT = 'ToParent',
	TOCADET = 'ToCadet',
}

export enum ProspectiveMemberPasswordCreationType {
	WITHPASSWORD = 'WithPassword',
	EMAILLINK = 'WithEmailLink',
	RANDOMPASSWORD = 'WithRandomPassword',
}

export enum GroupTarget {
	NONE = 'None',
	FLIGHT = 'Flight',
	ACCOUNT = 'Account',
}

export enum EventType {
	REGULAR = 'Regular',
	LINKED = 'Linked',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Permissions {
	export enum FlightAssign {
		NO = 'No',
		YES = 'Yes',
	}

	export enum MusterSheet {
		NO = 'No',
		YES = 'Yes',
	}

	export enum PTSheet {
		NO = 'No',
		YES = 'Yes',
	}

	export enum PromotionManagement {
		NONE = 'None',
		FULL = 'Full',
	}

	export enum AssignTasks {
		NO = 'No',
		YES = 'Yes',
	}

	export enum AdministerPT {
		NO = 'No',
		YES = 'Yes',
	}

	export enum ManageEvent {
		NONE = 'None',
		ADDDRAFTEVENTS = 'AddDraftEvents',
		FULL = 'Full',
	}

	export enum EventContactSheet {
		NO = 'No',
		YES = 'Yes',
	}

	export enum ORMOPORD {
		NO = 'No',
		YES = 'Yes',
	}

	export enum AssignTemporaryDutyPosition {
		NO = 'No',
		YES = 'Yes',
	}

	export enum ProspectiveMemberManagement {
		NONE = 'None',
		FULL = 'Full',
	}

	export enum EventLinkList {
		NO = 'No',
		YES = 'Yes',
	}

	export enum ManageTeam {
		NONE = 'None',
		FULL = 'Full',
	}

	export enum FileManagement {
		NONE = 'None',
		FULL = 'Full',
	}

	export enum PermissionManagement {
		NONE = 'None',
		FULL = 'Full',
	}

	export enum DownloadCAPWATCH {
		NO = 'No',
		YES = 'Yes',
	}

	export enum Notify {
		NO = 'No',
		GLOBAL = 'Global',
	}

	export enum RegistryEdit {
		NO = 'No',
		YES = 'Yes',
	}

	export enum ScanAdd {
		NO = 'No',
		YES = 'Yes',
	}

	export enum AttendanceView {
		PERSONAL = 'Personal',
		OTHER = 'Other',
	}

	export enum ViewAccountNotifications {
		NO = 'No',
		YES = 'Yes',
	}

	export enum CreateEventAccount {
		NO = 'No',
		YES = 'Yes',
	}
}

export type HTTPRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * As the return types are complex, keeping them consistent is key
 */
export interface SimpleMultCheckboxReturn {
	values: boolean[];
	labels: string[];
}
export interface MultCheckboxWithOtherSelected {
	values: boolean[];
	labels: string[];
	otherSelected: true;
	otherValue: string;
}

export interface MultCheckboxWithoutOtherSelected {
	values: boolean[];
	labels: string[];
	otherSelected: false;
}
export type OtherMultCheckboxReturn =
	| MultCheckboxWithOtherSelected
	| MultCheckboxWithoutOtherSelected;

export interface RadioReturnWithOtherSelected {
	labels: string[];
	otherValueSelected: true;
	otherValue: string;
}
export interface RadioReturnWithoutOtherSelected<E extends number> {
	labels: string[];
	otherValueSelected: false;
	selection: E;
}

export type RadioReturnWithOther<E extends number> =
	| RadioReturnWithOtherSelected
	| RadioReturnWithoutOtherSelected<E>;

/**
 * Provides some consistency in type information at least
 */
export type SessionID = string;

/**
 * Used mostly in conjunction with Identifiable below
 */
export type FromDatabase<T> = T & DatabaseIdentifiable;
export interface DatabaseIdentifiable {
	_id: string;
}

/**
 * Most objects are identifiable; this also allows for general purpose libraries
 * to filter or perform other operations on generally identifiable objects
 */
export interface Identifiable {
	/**
	 * The ID an object has. This is different from a NoSQL ID, as most of these
	 * are set by NHQ or by us
	 */
	id: string | number;
}

/**
 * Says that there is another ID to listen to, the account ID
 */
export interface AccountIdentifiable extends Identifiable {
	/**
	 * The ID of the account the folder belongs to
	 */
	accountID: string;
}

/**
 * A stack that is used when providing error information
 */
export interface ErrorStack {
	/**
	 * The name of the function being called
	 */
	name: string;
	/**
	 * The filename that contains where the function has stopped
	 */
	filename: string;
	/**
	 * Ditto filename
	 */
	line: number;
	/**
	 * Ditto line
	 */
	column: number;
}

export type ErrorType = 'Server' | 'Client' | 'DiscordBot';

/**
 * Describes errors that are stored in the database
 */
export interface ErrorObject {
	/**
	 * Stack trace of the error
	 */
	stack: ErrorStack[];
	/**
	 * When did the error occur?
	 */
	timestamp: number;
	/**
	 * What is the error message?
	 */
	message: string;
	/**
	 * TypeScript descriminator
	 */
	type: ErrorType;
}

/**
 * Describes errors that are stored in the database
 *
 * These errors apply to the server, as it contains information such as
 * the request method and path which the client doesn't get
 */
export interface ServerErrorObject extends ErrorObject, Identifiable {
	/**
	 * IDs are simple numbers, so devs can ask each other 'can you fix bug 30?'
	 */
	id: number;
	/**
	 * Requested path, used to recreate the error
	 */
	requestedPath: string;
	/**
	 * User information
	 *
	 * Null if not signed in
	 */
	requestedUser: MemberReference | null;
	/**
	 * Is it a GET, POST, PUT, DELETE, etc request
	 */
	requestMethod: HTTPRequestMethod;
	/**
	 * The file location of the error
	 */
	filename: string;
	/**
	 * The payload that caused the error for the API path
	 */
	payload: string;
	/**
	 * Account ID of page where error occurred
	 */
	accountID: string;
	/**
	 * TypeScript descriminator
	 */
	type: 'Server';
}

/**
 * The error information that a client can gather and send to the server
 */
export interface NewClientErrorObject extends ErrorObject {
	/**
	 * What page was the user on?
	 *
	 * Not going to take the time to figure out the component,
	 * that can be done by the developer looking in PageRouter.tsx
	 * rather simply
	 * It can also be reasoned, 'oh, the crash was at /photolibrary? The
	 * crash probably happened in PhotoLibrary.tsx'
	 */
	pageURL: string;
	/**
	 * Component stack
	 *
	 * Unfortunately, React doesn't seem to provide too much info about this...
	 */
	componentStack: string;
	/**
	 * TypeScript descriminator
	 */
	type: 'Client';
}

/**
 * The errors the client sends towards the server to be saved
 */
export interface ClientErrorObject extends NewClientErrorObject, Identifiable {
	/**
	 * IDs are simple numbers, so devs can ask each other 'can you fix bug 30?'
	 */
	id: number;
	/**
	 * Account ID of page where error occurred
	 */
	accountID: string;
	/**
	 * If the user was signed in, this is where they would go
	 *
	 * Null if not signed in
	 */
	user: MemberReference | null;
}

export interface DiscordBotErrorObject extends ErrorObject, Identifiable {
	/**
	 * IDs are simple numbers, so devs can ask each other 'can you fix bug 30?'
	 */
	id: number;
	/**
	 * The file location of the error
	 */
	filename: string;
	/**
	 * TypeScript descriminator
	 */
	type: 'DiscordBot';
}

export type Errors = ClientErrorObject | ServerErrorObject | DiscordBotErrorObject;

/**
 * Differentiates between accounts
 */
export enum AccountType {
	CAPSQUADRON = 'CAPSquadron',
	CAPGROUP = 'CAPGroup',
	CAPWING = 'CAPWing',
	CAPREGION = 'CAPRegion',
	CAPEVENT = 'CAPEvent',
}

/**
 * Used to represent the information that allows the Discord bot to control servers
 */
export interface DiscordServerInformation {
	/**
	 * The server (guild) ID
	 */
	serverID: string;
	/**
	 * Whether or not to display what flight the member is a part of
	 */
	displayFlight: boolean;
	/**
	 * Which channel to use to send out reminders to staff
	 *
	 * If null/undefined, don't send out reminders
	 */
	staffChannel: string | null | undefined;
}

/**
 * Used as the base for all the other accounts
 */
export interface NewAccountBase extends Identifiable {
	/**
	 * The main ID
	 */
	id: string;

	/**
	 * Discord server information
	 */
	discordServer: MaybeObj<DiscordServerInformation>;

	/**
	 * The main calendar for publishing events to
	 */
	mainCalendarID: string;
}

export interface AccountBase {
	/**
	 * Allow for website accounts to alias themselves
	 *
	 * Fake account IDs, as it were
	 *
	 * Will not be editable by the public
	 */
	aliases: string[];
}

/**
 * Used when requesting or editing an account
 */
export interface NewCAPSquadronAccountObject extends NewAccountBase {
	/**
	 * The main organization of the account
	 */
	mainOrg: number;
	/**
	 * The ids of the organizations
	 */
	orgIDs: number[];
	/**
	 * A reference to the account that belongs to the group that this unit belongs to
	 */
	parentGroup: MaybeObj<string>;
	/**
	 * A reference to the account that belongs to the wing that this unit belongs to
	 */
	parentWing: MaybeObj<string>;
}

/**
 * The raw account object stored in the database
 *
 * Doesn't contain simple boolean values for if it has expired and such, these are
 * put in the FullAccountObject that gets expanded upon and used more in practice
 */
export interface RawCAPSquadronAccountObject extends NewCAPSquadronAccountObject, AccountBase {
	/**
	 * Miscellaneous comments regarding the account
	 */
	comments: string;
	/**
	 * Marks this object as a CAP squadron Account
	 */
	type: AccountType.CAPSQUADRON;
}

export interface NewCAPGroupAccountObject extends NewAccountBase {
	/**
	 * The main organization of the account
	 */
	orgid: number;
	/**
	 * A reference to the account that belongs to the wing that this group belongs to
	 */
	parent: MaybeObj<string>;
}

export interface RawCAPGroupAccountObject extends NewCAPGroupAccountObject, AccountBase {
	/**
	 * Miscellaneous comments regarding the account
	 */
	comments: string;
	/**
	 * Marks this object as a CAP group Account
	 */
	type: AccountType.CAPGROUP;
}

export interface NewCAPWingAccountObject extends NewAccountBase {
	/**
	 * The main organization of the account
	 */
	orgid: number;
	/**
	 * Other organization IDs that hold wing leadership/staff
	 */
	orgIDs: number[];
	/**
	 * A reference to the account that belongs to the region that this wing belongs to
	 */
	parent: MaybeObj<string>;
}

export interface RawCAPWingAccountObject extends NewCAPWingAccountObject, AccountBase {
	/**
	 * Miscellaneous comments regarding the account
	 */
	comments: string;
	/**
	 * Marks this object as a CAP group Account
	 */
	type: AccountType.CAPWING;
}

export interface NewCAPRegionAccountObject extends NewAccountBase {
	/**
	 * The main organization of the account
	 */
	orgid: number;
}

export interface RawCAPRegionAccountObject extends NewCAPRegionAccountObject, AccountBase {
	/**
	 * Miscellaneous comments regarding the account
	 */
	comments: string;
	/**
	 * Marks this object as a CAP group Account
	 */
	type: AccountType.CAPREGION;
}

export interface NewCAPEventAccountObject extends NewAccountBase {
	/**
	 * A reference to the account that belongs to the wing that this group belongs to
	 *
	 * Because CAP above squadrons is filled with old people not accepting new tech,
	 * the echelon units may not necessarily have accounts to reference...
	 */
	parent: MaybeObj<string>;
}

export interface RawCAPEventAccountObject extends NewCAPEventAccountObject, AccountBase {
	/**
	 * Miscellaneous comments regarding the account
	 */
	comments: string;
	/**
	 * Marks this object as a CAP group Account
	 */
	type: AccountType.CAPEVENT;
}

export type RegularCAPAccountObject =
	| RawCAPSquadronAccountObject
	| RawCAPGroupAccountObject
	| RawCAPWingAccountObject
	| RawCAPRegionAccountObject;

/**
 * Represents the different kinds of CAP accounts possible
 */
export type CAPAccountObject = RegularCAPAccountObject | RawCAPEventAccountObject;

/**
 * Represents the different kinds of accounts possible
 */
export type AccountObject = CAPAccountObject;

export interface NewDebriefItem {
	/**
	 * The debrief item text
	 */
	debriefText: string;
	/**
	 * The debrief item visibility
	 */
	publicView: boolean;
}

/**
 * Debriefs for the various events that every member can submit
 *
 * This allows for others to look back on an event and ask what went
 * well, what could have gone better, etc
 */
export interface DebriefItem extends NewDebriefItem {
	/**
	 * Reference for the member submitting the debrief item
	 * Used to filter debrief item display to an individual member
	 */
	memberRef: MemberReference;
	/**
	 * String for the member submitting the debrief item
	 * Used to display debrief source even after member reference is no longer valid
	 */
	memberName: string;
	/**
	 * The date and time the item was submitted
	 */
	timeSubmitted: number;
}

export type RawPointOfContact = InternalPointOfContact | ExternalPointOfContact;

export interface RawRegularEventObject extends AccountIdentifiable, NewEventObject {
	/**
	 * ID of the Event, can be expressed as the event number
	 */
	id: number;
	/**
	 * Last modify time
	 */
	timeModified: number;
	/**
	 * When the object was created
	 */
	timeCreated: number;
	/**
	 * Who made the event
	 */
	author: MemberReference;
	/**
	 * New events start with no debrief items.  Each item is a separate
	 * comment provided by a member
	 */
	debrief: DebriefItem[];

	googleCalendarIds: {
		/**
		 * UUID of the Google Caldendar event on the main calendar
		 *
		 * Is null when the event is not to be published, such as a draft event
		 */
		mainId?: null | string;
		/**
		 * UUID of the Google Calendar registration deadline event on the main calendar
		 *
		 * Not present if there is no registration deadline
		 */
		regId?: null | string;
		/**
		 * UUID of the Goodle Calendar fee deadline event on the main calendar
		 *
		 * Not present if there is not a fee deadline
		 */
		feeId?: null | string;
	};

	type: EventType.REGULAR;
}

export interface RawLinkedEvent extends AccountIdentifiable {
	/**
	 * ID of the link to the event
	 */
	id: number;
	/**
	 * Who it is that established this link
	 */
	linkAuthor: MemberReference;
	/**
	 * The event ID that this link references
	 */
	targetEventID: number;
	/**
	 * The account ID that the event this link references belongs to
	 */
	targetAccountID: string;
	/**
	 * Used for quick rendering the calendar
	 */
	pickupDateTime: number;
	/**
	 * Used for quick rendering the calendar
	 */
	meetDateTime: number;
	/**
	 * Mirrors the information for a regular event object. This is present
	 * because a Google calendar will need items for the linked events as
	 * well
	 */
	googleCalendarIds: {
		mainId?: null | string;
		regId?: null | string;
		feeId?: null | string;
	};
	/**
	 * Allows for overriding properties on the original event
	 */
	extraProperties: Partial<NewEventObject>;
	/**
	 * Specify that this is a linked event
	 */
	type: EventType.LINKED;
}

/**
 * Represents the information stored in the database
 */
export type RawEventObject = RawLinkedEvent | RawRegularEventObject;

export type RawResolvedLinkedEvent = Omit<RawRegularEventObject, 'type'> & RawLinkedEvent;

export type RawResolvedEventObject = RawRegularEventObject | RawResolvedLinkedEvent;

export type FullPointOfContact = DisplayInternalPointOfContact | ExternalPointOfContact;

/**
 * The meat of what this website is designed for; events can be signed up for
 * and hold information to facilitate easy information distribution
 */
export interface RegularEventObject extends RawRegularEventObject {
	/**
	 * New events start with no attendance, but there can be procedurally
	 * generated attendance on the client side to include internal POCs
	 */
	attendance: AttendanceRecord[];
	/**
	 * Who to contact for more event information
	 */
	pointsOfContact: FullPointOfContact[];
}

export type EventObject = RegularEventObject | (Omit<RegularEventObject, 'type'> & RawLinkedEvent);

/**
 * Used for transfer when creating a new event object, as it cannot know what
 * some of the details are until the server handles it
 */
export interface NewEventObject {
	/**
	 * The name of the event (used to be EventName, dropped)
	 */
	name: string;
	/**
	 * The subtitle or subtext of the event name
	 */
	subtitle: string;
	/**
	 * When the event meets
	 */
	meetDateTime: number;
	/**
	 * Where the event meets
	 *
	 * TODO: Change this to be a Google places reference
	 */
	meetLocation: string;
	/**
	 * When the event starts; this differs from meet time, as the event may
	 * have a place for people to gather to carpool
	 */
	startDateTime: number;
	/**
	 * The location of the event itself, differs from meet as stated above
	 *
	 * TODO: Change this to be a Google places reference
	 */
	location: string;
	/**
	 * When the event finishes. Different from pickup the same way start and
	 * meet times are different. End location is implied to be the start
	 * location
	 */
	endDateTime: number;
	/**
	 * When cadets can be picked up from the event
	 */
	pickupDateTime: number;
	/**
	 * Where cadets will be, most likely will happen to be the meet location
	 * or event location
	 *
	 * TODO: Change this to be a Google places reference
	 */
	pickupLocation: string;
	/**
	 * Whether or not transportation is provided from the meet location to
	 * the event location
	 */
	transportationProvided: boolean;
	/**
	 * Description; e.g., using a van
	 */
	transportationDescription: string;
	/**
	 * The uniforms that can be worn by Senior Members
	 */
	smuniform: SimpleMultCheckboxReturn;
	/**
	 * The uniforms that can be worn by Cadets
	 */
	cuniform: SimpleMultCheckboxReturn;
	/**
	 * How many people we want at the event
	 */
	desiredNumberOfParticipants: number;
	/**
	 * If there is a registration deadline, this is present
	 * As it is partial, not required information, this may be
	 * excluded
	 */
	registration?: null | {
		/**
		 * When the registration closes
		 */
		deadline: number;
		/**
		 * What information there is regarding registration closing
		 */
		information: string;
	};
	/**
	 * Same as registration deadline but for fees
	 */
	participationFee?: null | {
		/**
		 * When the fee is due
		 */
		feeDue: number;
		/**
		 * How much is due before showing up to the event
		 */
		feeAmount: number;
	};
	/**
	 * custom email signup notification markdown text
	 */
	emailBody: MaybeObj<{
		body: string;
	}>;
	/**
	 * Describes the options for meals
	 */
	mealsDescription: OtherMultCheckboxReturn;
	/**
	 * Describes where cadets may be sleeping
	 */
	lodgingArrangments: OtherMultCheckboxReturn;
	/**
	 * Describes how strenuous the activity may be to cadets
	 */
	activity: OtherMultCheckboxReturn;
	/**
	 * Describes how hard the activity may be
	 */
	highAdventureDescription: string;
	/**
	 * A list of things that will be required
	 *
	 * Should this only be shown to certain members? E.g., team members,
	 * signed in members, or just all?
	 */
	requiredEquipment: string[];
	/**
	 * External websites
	 */
	eventWebsite: string;
	/**
	 * Forms include CAP ID, CAPF 31, etc.
	 */
	requiredForms: OtherMultCheckboxReturn;
	/**
	 * Comments from the event author, description, etc.
	 */
	comments: string;
	/**
	 * Comments intended to be displayed to signed in members
	 */
	memberComments: string;
	/**
	 * Whether or not signups are accepted
	 */
	acceptSignups: boolean;
	/**
	 * What to say if sign ups are denied; may be dropped if
	 * acceptSignups is true
	 */
	signUpDenyMessage: null | string;
	/**
	 * Show on the upcoming events portion of the main page
	 */
	showUpcoming: boolean;
	/**
	 * Is there a valid group number available?
	 */
	groupEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	/**
	 * What is the region event number
	 */
	regionEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	/**
	 * If all the details are completely filled in
	 */
	complete: boolean;
	/**
	 * Comments for/from administrators
	 */
	administrationComments: string;
	/**
	 * Tentative, complete, cancelled, etc.
	 */
	status: EventStatus;
	/**
	 * Who to contact for more event information
	 */
	pointsOfContact: RawPointOfContact[];
	/**
	 * Custom fields for attendance records
	 */
	customAttendanceFields: CustomAttendanceField[];
	/**
	 * Can cadets sign up for only a portion of the event?
	 */
	signUpPartTime: boolean;
	/**
	 * If this is a team event, a team can be specified for future features
	 */
	teamID?: null | number;
	/**
	 * Limit sign ups to team members
	 *
	 * Only required if a team is selected
	 */
	limitSignupsToTeam?: null | boolean;
	/**
	 * Files that may be associated with the event; e.g. forms
	 */
	fileIDs: string[];
	/**
	 * Whether or not attendance view should be displayed to all members or only to Managers and POCs
	 */
	privateAttendance: boolean;

	/**
	 * Used to mark it as an educational event, one which fulfills the specified requirement
	 */
	requirementTag?: null | string;
}

/**
 * Used by the Event class to handle safely adding new records
 */
export interface NewAttendanceRecord {
	/**
	 * Comments from the cadet
	 */
	comments: string;
	/**
	 * Committed, rescindend commitment to attend, etc
	 */
	status: AttendanceStatus;
	/**
	 * If they plan to use transportation provided
	 */
	planToUseCAPTransportation: boolean;

	// If the member stays for the whole event, this will match the
	// start/end date times of the event
	/**
	 * Details how long the member will stay for
	 */
	shiftTime?: null | {
		arrivalTime: number;

		departureTime: number;
	};
	/**
	 * A new attendance record may contain this if someone tries to
	 * add someone else
	 *
	 * Only succeeds if they have the permission to do so
	 */
	memberID?: MemberReference;
	/**
	 * An application of the custom attendance fields
	 */
	customAttendanceFieldValues: CustomAttendanceFieldValue[];
}

/**
 * A full attendance record that has been inserted in the database
 */
export interface AttendanceRecord extends NewAttendanceRecord {
	/**
	 * When they signed up
	 */
	timestamp: number;
	/**
	 * Who they are
	 */
	memberID: MemberReference;
	/**
	 * Record member rank and name to show what rank they were when
	 * they participated
	 */
	memberName: string;
	/**
	 * Whether or not the emails for this cadet/for the POCs have been sent
	 */
	summaryEmailSent: boolean;

	// If the member stays for the whole event, this will match the
	// start/end date times of the event
	shiftTime: {
		arrivalTime: number;

		departureTime: number;
	};

	// Details where the record come from
	sourceEventID: number;
	sourceAccountID: string;
}

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

export interface FullAttendanceRecord extends AttendanceRecord {
	memberEmail: string;
}

/**
 * A Custom Event Attendance Field
 */
export interface CustomAttendanceFieldBase {
	/**
	 * The Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType;
	/**
	 * All custom attendance fields have a title
	 */
	title: string;
	/**
	 * Custom attendance can fields have a pre-fill value
	 */
	preFill: unknown;

	/**
	 * Display title and value to member (will be visible to POC/Manager)
	 */
	displayToMember: boolean;
	/**
	 * Allow modify permission by member (will be writable by POC/Manager)
	 */
	allowMemberToModify: boolean;
}

/**
 * A Checkbox Custom Attendance Field
 */
export interface CustomAttendanceFieldCheckbox extends CustomAttendanceFieldBase {
	/**
	 * Override Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType.CHECKBOX;
	/**
	 * Set prefill type to boolean
	 */
	preFill: boolean;
}

/**
 * A Date Custom Attendance Field
 */
export interface CustomAttendanceFieldDate extends CustomAttendanceFieldBase {
	/**
	 * Override Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType.DATE;
	/**
	 * Set prefill type to accept system date/time
	 */
	preFill: number;
}

/**
 * A File Custom Attendance Field
 */
export interface CustomAttendanceFieldFile extends CustomAttendanceFieldBase {
	/**
	 * Override Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType.FILE;
}

/**
 * A Number Custom Attendance Field
 */
export interface CustomAttendanceFieldNumber extends CustomAttendanceFieldBase {
	/**
	 * Override Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType.NUMBER;
	/**
	 * Set prefill type to number
	 */
	preFill: number;
}

/**
 * A Textbox Custom Attendance Field
 */
export interface CustomAttendanceFieldText extends CustomAttendanceFieldBase {
	/**
	 * Override Custom Attendance Field Type
	 */
	type: CustomAttendanceFieldEntryType.TEXT;
	/**
	 * Set prefill type to string
	 */
	preFill: string;
}

export type CustomAttendanceField =
	| CustomAttendanceFieldCheckbox
	| CustomAttendanceFieldDate
	| CustomAttendanceFieldFile
	| CustomAttendanceFieldNumber
	| CustomAttendanceFieldText;

export interface CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType;

	title: string;
}

export interface CustomAttendanceFieldCheckboxValue extends CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType.CHECKBOX;

	value: boolean;
}

export interface CustomAttendanceFieldDateValue extends CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType.DATE;

	value: number;
}

export interface CustomAttendanceFieldFileValue extends CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType.FILE;

	value: string[];
}

export interface CustomAttendanceFieldNumberValue extends CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType.NUMBER;

	value: number;
}

export interface CustomAttendanceFieldTextValue extends CustomAttendanceFieldValueBase {
	type: CustomAttendanceFieldEntryType.TEXT;

	value: string;
}

export type CustomAttendanceFieldValue =
	| CustomAttendanceFieldCheckboxValue
	| CustomAttendanceFieldDateValue
	| CustomAttendanceFieldFileValue
	| CustomAttendanceFieldNumberValue
	| CustomAttendanceFieldTextValue;

/**
 * A basic point of contact
 */
export interface PointOfContact {
	/**
	 * Used by TypeScript/JavaScript to differentiate between different
	 * points of contact
	 */
	type: PointOfContactType;
	/**
	 * All points of contact have an email
	 *
	 * Internal points of contact provide this as the information may be old and updated in this record
	 */
	email: string;
	/**
	 * All of them should have a phone number
	 *
	 * Reasons for having this are similar to reasons for having email
	 */
	phone: string;
	/**
	 * All of them can have a position but it is optional
	 */
	position: string;

	// Email settings for a POC
	/**
	 * Receive a notification for them being a POC
	 */
	receiveUpdates: boolean;
	/**
	 * Email the roster to the POC at some point in time
	 */
	receiveRoster: boolean;
	/**
	 * Email updates for the event
	 */
	receiveEventUpdates: boolean;
	/**
	 * Email whenever someone signs up
	 */
	receiveSignUpUpdates: boolean;
	/**
	 * Whether or not to publicly show the contact info
	 *
	 * Value may not exist due to backwards compatability; if it doesn't, don't show info
	 */
	publicDisplay: boolean | undefined;
}

/**
 * This is a point of contact specific to CAP, or at least those we can have
 * references to (ProspectiveMembers)
 */
export interface InternalPointOfContact extends PointOfContact {
	/**
	 * Used for differentiating CAP points of contact
	 */
	type: PointOfContactType.INTERNAL;
	/**
	 * CAP ID
	 */
	memberReference: MemberReference;
}

/**
 * As the InternalPointOfContact does not store the name to prevent stale data,
 * and the client may need that information, here it is
 */
export interface DisplayInternalPointOfContact extends InternalPointOfContact {
	/**
	 * Used for compound documentation
	 */
	name: string;
}

/**
 * External POCs don't have member references, just a name
 */
export interface ExternalPointOfContact extends PointOfContact {
	/**
	 * Used for differentiating non CAP points of contact
	 */
	type: PointOfContactType.EXTERNAL;
	/**
	 * As we don't have CAP ID, we can't pull name or rank
	 */
	name: string;
}

/**
 * The permissions list for various members
 */
export interface CAPSquadronMemberPermissions {
	type: AccountType.CAPSQUADRON;

	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign flight members
	 */
	FlightAssign: Permissions.FlightAssign;
	/**
	 * Whether or not the user can get the muster sheet
	 */
	MusterSheet: Permissions.MusterSheet;
	/**
	 * Whether or not the user can get PT sheets
	 */
	PTSheet: Permissions.PTSheet;
	/**
	 * Whether or not the user can manage promotions
	 */
	PromotionManagement: Permissions.PromotionManagement;
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: Permissions.AssignTasks;
	/**
	 * Whether or not the user can administer PT
	 */
	AdministerPT: Permissions.AdministerPT;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: Permissions.ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: Permissions.EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: Permissions.ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition;
	/**
	 * Whether or not members can initiate scan add sessions
	 */
	ScanAdd: Permissions.ScanAdd;
	/**
	 * Whether or not the user can view attendance for other people
	 */
	AttendanceView: Permissions.AttendanceView;
	/**
	 * Whether or not the user can manage prospective members
	 */
	ProspectiveMemberManagement: Permissions.ProspectiveMemberManagement;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: Permissions.EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: Permissions.ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: Permissions.FileManagement;

	// Admin privileges
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: Permissions.PermissionManagement;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Permissions.Notify;
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: Permissions.RegistryEdit;
	/**
	 * Whether or not the member can view notifications designated for account admins
	 */
	ViewAccountNotifications: Permissions.ViewAccountNotifications;
}

/**
 * The permissions list for various members
 */
export interface CAPEventMemberPermissions {
	type: AccountType.CAPEVENT;

	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign flight members
	 */
	FlightAssign: Permissions.FlightAssign;
	/**
	 * Whether or not the user can get the muster sheet
	 */
	MusterSheet: Permissions.MusterSheet;
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: Permissions.AssignTasks;
	/**
	 * Whether or not the user can administer PT
	 */
	AdministerPT: Permissions.AdministerPT;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: Permissions.ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: Permissions.EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: Permissions.ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition;
	/**
	 * Whether or not members can initiate scan add sessions
	 */
	ScanAdd: Permissions.ScanAdd;
	/**
	 * Whether or not the user can view attendance for other people
	 */
	AttendanceView: Permissions.AttendanceView;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: Permissions.EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: Permissions.ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: Permissions.FileManagement;

	// Admin privileges
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: Permissions.PermissionManagement;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Permissions.Notify;
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: Permissions.RegistryEdit;
	/**
	 * Whether or not the member can view notifications designated for account admins
	 */
	ViewAccountNotifications: Permissions.ViewAccountNotifications;
}

export interface CAPGroupMemberPermissions {
	type: AccountType.CAPGROUP;

	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: Permissions.AssignTasks;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: Permissions.ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: Permissions.EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: Permissions.ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: Permissions.EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: Permissions.ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: Permissions.FileManagement;
	/**
	 * Whether or not members can initiate scan add sessions
	 */
	ScanAdd: Permissions.ScanAdd;
	/**
	 * Whether or not the user can view attendance for other people
	 */
	AttendanceView: Permissions.AttendanceView;

	// Admin privileges
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: Permissions.PermissionManagement;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Permissions.Notify;
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: Permissions.RegistryEdit;
	/**
	 * Whether or not the member can view notifications designated for account admins
	 */
	ViewAccountNotifications: Permissions.ViewAccountNotifications;
}

export interface CAPWingMemberPermissions {
	type: AccountType.CAPWING;

	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: Permissions.AssignTasks;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: Permissions.ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: Permissions.EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: Permissions.ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: Permissions.EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: Permissions.ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: Permissions.FileManagement;
	/**
	 * Whether or not members can initiate scan add sessions
	 */
	ScanAdd: Permissions.ScanAdd;
	/**
	 * Whether or not the user can view attendance for other people
	 */
	AttendanceView: Permissions.AttendanceView;

	// Admin privileges
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: Permissions.PermissionManagement;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Permissions.Notify;
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: Permissions.RegistryEdit;
	/**
	 * Whether or not the member can view notifications designated for account admins
	 */
	ViewAccountNotifications: Permissions.ViewAccountNotifications;
	/**
	 * Used for creating sub accounts
	 */
	CreateEventAccount: Permissions.CreateEventAccount;
}

export interface CAPRegionMemberPermissions {
	type: AccountType.CAPREGION;

	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: Permissions.AssignTasks;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: Permissions.ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: Permissions.EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: Permissions.ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: Permissions.EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: Permissions.ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: Permissions.FileManagement;
	/**
	 * Whether or not members can initiate scan add sessions
	 */
	ScanAdd: Permissions.ScanAdd;
	/**
	 * Whether or not the user can view attendance for other people
	 */
	AttendanceView: Permissions.AttendanceView;

	// Admin privileges
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: Permissions.PermissionManagement;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Permissions.Notify;
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: Permissions.RegistryEdit;
	/**
	 * Whether or not the member can view notifications designated for account admins
	 */
	ViewAccountNotifications: Permissions.ViewAccountNotifications;
	/**
	 * Used for creating sub accounts
	 */
	CreateEventAccount: Permissions.CreateEventAccount;
}

export type MemberPermissions =
	| CAPSquadronMemberPermissions
	| CAPWingMemberPermissions
	| CAPEventMemberPermissions
	| CAPGroupMemberPermissions
	| CAPRegionMemberPermissions;

export type MemberPermission = keyof Omit<
	Omit<CAPSquadronMemberPermissions, 'type'> &
		Omit<CAPWingMemberPermissions, 'type'> &
		Omit<CAPEventMemberPermissions, 'type'> &
		Omit<CAPRegionMemberPermissions, 'type'> &
		Omit<CAPGroupMemberPermissions, 'type'>,
	'type'
>;

export type PermissionForName<T extends MemberPermission> = (Omit<
	CAPSquadronMemberPermissions,
	'type'
> &
	Omit<CAPWingMemberPermissions, 'type'> &
	Omit<CAPEventMemberPermissions, 'type'> &
	Omit<CAPRegionMemberPermissions, 'type'> &
	Omit<CAPGroupMemberPermissions, 'type'>)[T];

export interface StoredMemberPermissions {
	member: MemberReference;
	accountID: string;
	permissions: MemberPermissions;
}

/**
 * This information is used to store if a member has said they will be absent until a date,
 * and comments associated with it
 */
export interface AbsenteeInformation {
	/**
	 * Used by the member to describe why a cadet will be absent
	 */
	comments: string;
	/**
	 * Used to say how long the cadet is absent for
	 */
	absentUntil: number;
}

/**
 * String representation of the member type, as there needs to be a way to differentiate
 */
export type MemberType = CAPMemberType;

/**
 * Useful for displaying simple things like where a user hails from
 */
export interface ShortAccountInfo extends Identifiable {
	/**
	 * The ID of an account the member hails from
	 */
	id: string;

	/**
	 * The name of the account the member hails from
	 */
	name: string;
}

/**
 * Used to store short account info in the database
 */
export interface StoredAccountMembership {
	/**
	 * The account a member may be a part of
	 */
	accountID: string;

	/**
	 * The member that isn't a part of the account but participates frequently
	 */
	member: MemberReference;
}

/**
 * Information stored about a member in our database
 *
 * Does not include permission information, which is stored seperately
 * This is so that permissions can be on an account basis
 */
export interface MemberObject extends Identifiable {
	/**
	 * The CAPID of the member
	 */
	id: number | string;
	/**
	 * First name of member
	 */
	nameFirst: string;
	/**
	 * Middle name of member
	 */
	nameMiddle: string;
	/**
	 * Last name of member
	 */
	nameLast: string;
	/**
	 * Suffix of member
	 */
	nameSuffix: string;
	/**
	 * The type of user, as there are multiple
	 */
	type: MemberType;
	/**
	 * Shows how long the member is absent for
	 *
	 * Should not be used if null or if the time has passed
	 */
	absenteeInformation: AbsenteeInformation | null;
}

/**
 * Users are different in that they are actively using the website right now,
 * and they have a session. They also have created an account with us
 *
 * This is important because this means they have a session ID and permissions
 *
 * Does not extend MemberObject to allow for TypeScript to discriminate between users
 */
export interface UserObject {
	/**
	 * Permissions a user may have
	 */
	permissions: MemberPermissions;
	/**
	 * Users have a session and therefore a session ID
	 */
	sessionID: string;
}

/**
 * Users are different in that they are actively using the website right now,
 * and they have a session. They also have created an account with us
 *
 * This is important because this means they have a session ID and permissions
 *
 * Client users however do not have a session ID; they instead just have permissions as
 * the session ID is stored in an HTTPOnly cookie
 *
 * Does not extend MemberObject to allow for TypeScript to discriminate between users
 */
export interface ClientUserObject {
	permissions: MemberPermissions;
}

/**
 * A descriminator type used to help determine what the type of object is
 */
export type CAPMemberType = 'CAPNHQMember' | 'CAPProspectiveMember';

/**
 * These are common to all CAPMembers, not necessarily all members
 */
export interface RawCAPMember extends MemberObject {
	/**
	 * Descriminant
	 */
	type: CAPMemberType;
	/**
	 * The rank of the member provided
	 */
	memberRank: string;
	/**
	 * Whether or not the member is a senior member
	 */
	seniorMember: boolean;
	/**
	 * The Squadron a member belongs to
	 */
	squadron: string;
	/**
	 * The organization the member belongs to
	 */
	orgid: number;
	/**
	 * Contact information for the user
	 */
	contact: CAPMemberContact;
	/**
	 * User login ID
	 */
	usrID: string;
}

/**
 * Descriminant for the short duty position
 */
export type ShortDutyPositionType = 'CAPUnit' | 'NHQ';

export interface NewShortCAPUnitDutyPosition {
	/**
	 * Represents the duty assigned
	 */
	duty: string;
	/**
	 * Signifies this is not an official duty from CAPNHQ
	 */
	type: 'CAPUnit';
	/**
	 * Determines when it expires
	 */
	expires: number;
}

/**
 * Short duty positions for use by Event Manager
 */
export interface ShortCAPUnitDutyPosition extends NewShortCAPUnitDutyPosition {
	/**
	 * Represents the date it was assigned
	 */
	date: number;
}

/**
 * Short form of duty positions issued by capnhq.gov
 */
export interface ShortNHQDutyPosition {
	/**
	 * Represents the duty assigned
	 */
	duty: string;
	/**
	 * Represents the date it was assigned
	 */
	date: number;
	/**
	 * Represents which organization it is for
	 */
	orgid: number;
	/**
	 * Whether or not this duty position is an assitant duty position
	 */
	assistant: boolean;
	/**
	 * Signifies this is an official duty from CAPNHQ
	 */
	type: 'NHQ';
}

/**
 * Union type for both CAPUnit and NHQ duty positions
 */
export type ShortDutyPosition = ShortNHQDutyPosition | ShortCAPUnitDutyPosition;

/**
 * A more full CAP member
 */
export interface CAPMemberObject extends RawCAPMember {
	/**
	 * Duty positions listed on CAP NHQ, along with temporary ones assigned here
	 */
	dutyPositions: ShortDutyPosition[];
	/**
	 * The Squadron a member belongs to
	 */
	squadron: string;
	/**
	 * The flight of the member
	 */
	flight: string | null;
	/**
	 * The list of teams the member is a part of
	 */
	teamIDs: number[];
}

/**
 * The preferable version of CAPMember, as it is returned from NHQMember and contains
 * the most up to date information and has a specific type
 */
export interface CAPNHQMemberObject extends CAPMemberObject {
	/**
	 * Strict CAP IDs are six digit numbers
	 */
	id: number;
	/**
	 * Descriminant
	 */
	type: 'CAPNHQMember';
	/**
	 * The date of membership establishment
	 */
	joined: number;
	/**
	 * When the membership lapses for this member
	 */
	expirationDate: number;
	/**
	 * The date of birth of the member
	 */
	dateOfBirth: number;
	/**
	 * The member's gender
	 */
	gender: string;
}

/**
 * The information we store in our database is represented as such
 */
export interface RawCAPProspectiveMemberObject extends RawCAPMember, AccountIdentifiable {
	/**
	 * We use string IDs for this account type
	 */
	id: string;
	/**
	 * Descriminant
	 */
	type: 'CAPProspectiveMember';
	/**
	 * Flights are stored in the raw database object for prospective members
	 */
	flight: string | null;
	/**
	 * Prospective member duty positions are stored in the ExtraMemberInformation table
	 *
	 * There is no way to modify this
	 */
	dutyPositions: ShortDutyPosition[];
	/**
	 * Tells resolvereference to continue resolving this member information, or to stop here
	 */
	hasNHQReference: false;
}

export interface RawCAPProspectiveUpgradedMemberObject extends AccountIdentifiable {
	/**
	 * We use string IDs for this account type
	 */
	id: string;
	/**
	 * Descriminant
	 */
	type: 'CAPProspectiveMember';
	/**
	 * Tells resolveReference to go further and resolve to a CAP NHQ member
	 */
	hasNHQReference: true;
	/**
	 * The NHQ member this prospective member object is replaced by
	 */
	nhqReference: CAPNHQMemberReference;
}

export type StoredProspectiveMemberObject =
	| RawCAPProspectiveMemberObject
	| RawCAPProspectiveUpgradedMemberObject;

/**
 * A full ProspectiveMember is similar to a CAPMember
 */
export interface CAPProspectiveMemberObject extends RawCAPProspectiveMemberObject, CAPMemberObject {
	/**
	 * Prospective members have string IDs
	 */
	id: string;
	/**
	 * Typescript deliminator
	 */
	type: 'CAPProspectiveMember';
}

export type NewCAPProspectiveMember = Omit<
	RawCAPProspectiveMemberObject,
	| 'id'
	| 'absenteeInformation'
	| 'teamIDs'
	| 'type'
	| 'usrID'
	| 'accountID'
	| 'dutyPositions'
	| 'memberRank'
	| 'orgid'
	| 'squadron'
	| 'hasNHQReference'
	| '_id'
>;

export interface CAPProspectiveMemberPasswordCreationWithPassword {
	type: CAPProspectiveMemberPasswordCreationType.WITHPASSWORD;

	password: string;

	username: string;
}

export interface CAPProspectiveMemberPasswordCreationWithEmail {
	type: CAPProspectiveMemberPasswordCreationType.EMAILLINK;
}

export interface CAPProspectiveMemberPasswordCreationWithRandomPassword {
	type: CAPProspectiveMemberPasswordCreationType.RANDOMPASSWORD;

	username: string;
}

export type CAPProspectiveMemberPasswordCreation =
	| CAPProspectiveMemberPasswordCreationWithEmail
	| CAPProspectiveMemberPasswordCreationWithPassword
	| CAPProspectiveMemberPasswordCreationWithRandomPassword;

/**
 * Used when referring to members, as numerical CAPIDs do not work as well with
 * ProspectiveMembers
 *
 * Type unions are also not preferred
 */
interface MemberReferenceBase {
	type: MemberType;
}

/**
 * ProspectiveMemberReference refers to a ProspectiveMember
 */
export interface CAPProspectiveMemberReference extends MemberReferenceBase {
	type: 'CAPProspectiveMember';
	id: string;
}

/**
 * NHQMemberReference refers to a NHQMember
 */
export interface CAPNHQMemberReference extends MemberReferenceBase {
	type: 'CAPNHQMember';
	id: number;
}

export type CAPMemberReference = CAPNHQMemberReference | CAPProspectiveMemberReference;
export type CAPMember = CAPProspectiveMemberObject | CAPNHQMemberObject;

/**
 * Union type to allow for referring to both NHQMembers and ProspectiveMembers
 */
export type MemberReference = CAPMemberReference;
export type Member = CAPMember;
export type User = Member & UserObject;
export type ClientUser = Member & ClientUserObject;

export type MemberForMemberType<
	T extends MemberReference['type']
> = T extends CAPNHQMemberReference['type']
	? CAPNHQMemberObject
	: T extends CAPProspectiveMemberReference['type']
	? CAPProspectiveMemberObject
	: Member;

export type MemberForReference<T extends MemberReference> = MemberForMemberType<T['type']>;

export type ReferenceForMember<T extends Member> = T extends CAPNHQMemberReference
	? CAPNHQMemberReference
	: T extends CAPProspectiveMemberReference
	? CAPProspectiveMemberReference
	: MemberReference;

export type ReferenceForType<T extends MemberType> = T extends 'CAPProspectiveMember'
	? CAPProspectiveMemberReference
	: T extends 'CAPNHQMember'
	? CAPNHQMemberReference
	: MemberReference;

export type UserForReference<T extends MemberReference> = MemberForReference<T> & UserObject;

/**
 * Records temporary duty positions that we assign
 */
export interface TemporaryDutyPosition {
	/**
	 * How long the temporary duty position is valid for; they are temporary
	 * because someone may only need to have a position for a single meeting week
	 */
	validUntil: number;

	/**
	 * Following NHQ naming, as this is used by Member to in a slick
	 * MapReduce way
	 */
	Duty: string;

	/**
	 * When the duty position was assigned
	 */
	assigned: number;
}

/**
 * Extra member information that may need to be stored for the user that
 * our website uses and NHQ doesn't, for instance temporary duty positions and
 * permissions
 */
export interface ExtraMemberInformation {
	/**
	 * The member this information belongs to
	 */
	member: MemberReference;
	/**
	 * IDs of teams the member is a part of
	 */
	teamIDs: number[];
	/**
	 * The Account this information belongs to
	 */
	accountID: string;
	/**
	 * Declares the absentee information
	 *
	 * Null if non existant
	 */
	absentee: AbsenteeInformation | null;
}

export interface CAPExtraMemberInformation extends ExtraMemberInformation {
	/**
	 * Extra duty positions that are assigned to the member
	 */
	temporaryDutyPositions: TemporaryDutyPosition[];
	/**
	 * Member flight
	 *
	 * Undefined if the member is a senior member
	 */
	flight: null | string;

	/**
	 * Descriminates the type
	 */
	type: 'CAP';
}

export type AllExtraMemberInformation = CAPExtraMemberInformation;

/**
 * Refers to the information that allows a member to link an event to an account
 */
export interface AccountLinkTarget {
	/**
	 * The account ID that a user can target
	 */
	id: string;
	/**
	 * A pretty name for an account
	 */
	name: string;
}

export enum SigninKeyScopeType {
	GLOBAL = 'Global',
	ACCOUNT = 'Account',
	USER = 'User',
}

export interface SigninKeyGlobalScope {
	type: SigninKeyScopeType.GLOBAL;
}

export interface SigninKeyAccountScope {
	type: SigninKeyScopeType.ACCOUNT;

	accountID: string;
}

export interface SigninKeyUserAccountScope {
	type: SigninKeyScopeType.USER;

	member: MemberReference;
}

export type SigninKeyScope =
	| SigninKeyGlobalScope
	| SigninKeyAccountScope
	| SigninKeyUserAccountScope;

/**
 * Used to allow for sending out private keys to use to authenticate
 */
export interface StoredSigninKey {
	signatureID: string;

	publicKey: string;

	scope: SigninKeyScope;
}

/**
 * Used to allow for sending out private keys to use to authenticate
 */
export interface StoredSigninNonce {
	nonce: string;

	signatureID: string;

	expireTime: number;
}

export enum SigninTokenType {
	RECAPTCHA = 'Recaptcha',
	SIGNATURE = 'Signature',
}

export interface RecaptchaSigninToken {
	type: SigninTokenType.RECAPTCHA;

	recaptchToken: string;
}

/**
 * Uses an RSA public/private key pair to verify a signature of the nonce
 */
export interface SignatureSigninToken {
	type: SigninTokenType.SIGNATURE;

	nonce: string;

	signature: string;

	signatureID: string;
}

export type SigninToken = RecaptchaSigninToken | SignatureSigninToken;

/**
 * Represents the request body used to try and sign someone in
 */
export interface SigninRequest {
	/**
	 * Represents the login credentials for a user
	 */
	username: string;
	/**
	 * Represents the login credentials for a user
	 */
	password: string;
	/**
	 * Allows for proving the person signing in isn't a bot
	 */
	token: SigninToken;
}

/**
 * The object that represents a successful session, as signing in
 * returns a session
 */
export interface SuccessfulSigninReturn {
	/**
	 * No error with this session
	 */
	error: MemberCreateError.NONE;
	/**
	 * The member details
	 */
	member: ClientUser;
	/**
	 * Returns the amount of notifications the member has
	 */
	notificationCount: number;
	/**
	 * Returns the amount of unfinished tasks the member has
	 */
	taskCount: number;
	/**
	 * Returns the accounts that a member is able to link events to
	 */
	linkableAccounts: AccountLinkTarget[];
	/**
	 * Returns all the academic tags from events this member has attended
	 */
	requirementTags: string[];
}

/**
 * Used to create a new password
 */
export interface ExpiredSuccessfulSigninReturn {
	/**
	 * Just an expired password
	 */
	error: MemberCreateError.PASSWORD_EXPIRED;
}

/**
 * Can't simply return null, need to return information as to why
 * things failed
 */
export interface FailedSigninReturn {
	/**
	 * Contains error details
	 */
	error:
		| MemberCreateError.INCORRRECT_CREDENTIALS
		| MemberCreateError.SERVER_ERROR
		| MemberCreateError.UNKOWN_SERVER_ERROR
		| MemberCreateError.INVALID_SESSION_ID
		| MemberCreateError.RECAPTCHA_INVALID
		| MemberCreateError.ACCOUNT_EXPIRED;
}

export interface SigninRequiresMFA {
	/**
	 * Reports the fact that the account may need to submit MFA information
	 */
	error: MemberCreateError.ACCOUNT_USES_MFA;
}

export interface AccountExpiredResult {
	error: MemberCreateError.ACCOUNT_EXPIRED;
}

/**
 * Allows for multiplexing the data together but still have type inference and
 * not use try/catch
 */
export type SigninReturn =
	| SuccessfulSigninReturn
	| ExpiredSuccessfulSigninReturn
	| FailedSigninReturn
	| SigninRequiresMFA
	| AccountExpiredResult;

/**
 * Used by the different files to indicate what they are
 *
 * Follows the example of Google APIs
 */
export interface DriveObject extends AccountIdentifiable {
	/**
	 * The kind of object it is, as these pass through JSON requests
	 */
	kind: string;
}

/**
 * Used for denoting user permissions
 */
export interface FileUserControlList {
	/**
	 *
	 * Descriminant, used for determining who this applies to
	 */
	type: FileUserAccessControlType.USER;
	/**
	 * The actual member reference
	 */
	reference: MemberReference;
	/**
	 * What the permission is they have
	 */
	permission: FileUserAccessControlPermissions;
}

/**
 * Used for denoting team permissions
 */
export interface FileTeamControlList {
	/**
	 *
	 * Descriminant, used for determining who this applies to
	 */
	type: FileUserAccessControlType.TEAM;
	/**
	 * Which team does this apply to?
	 */
	teamID: number;
	/**
	 * The permission that is assigned
	 */
	permission: FileUserAccessControlPermissions;
}

/**
 * Used for denoting permissions for those who are signed in, but still
 * other
 */
export interface FileAccountControlList {
	/**
	 *
	 * Descriminant, used for determining who this applies to
	 */
	type: FileUserAccessControlType.ACCOUNTMEMBER;
	/**
	 * The permission that is assigned
	 */
	permission: FileUserAccessControlPermissions;
}
/**
 * Used for denoting permissions for those who are signed in, but still
 * other
 */
export interface FileSignedInControlList {
	/**
	 *
	 * Descriminant, used for determining who this applies to
	 */
	type: FileUserAccessControlType.SIGNEDIN;
	/**
	 * The permission that is assigned
	 */
	permission: FileUserAccessControlPermissions;
}

/**
 * Used for denoting other permissions
 */
export interface FileOtherControlList {
	/**
	 *
	 * Descriminant, used for determining who this applies to
	 */
	type: FileUserAccessControlType.OTHER;
	/**
	 * The permission that is assigned
	 */
	permission: FileUserAccessControlPermissions;
}

/**
 * Union type of different File permissions
 */
export type FileControlListItem =
	| FileUserControlList
	| FileTeamControlList
	| FileAccountControlList
	| FileSignedInControlList
	| FileOtherControlList;

/**
 * Shows what can be edited by the client
 */
export interface EditableFileObjectProperties {
	/**
	 * The id of the uploader
	 */
	owner: MemberReference;
	/**
	 * The name of the file
	 */
	fileName: string;
	/**
	 * Comments about the file
	 */
	comments: string;
	/**
	 * Whether or not the file is displayed in the photo library (only works with photos)
	 */
	forDisplay: boolean;
	/**
	 * Whether or not the file is to be shown in the slideshow
	 */
	forSlideshow: boolean;
	/**
	 * The permissions for the file
	 */
	permissions: FileControlListItem[];
}

/**
 * Represents a file. Metadata (shown) is stored in the database, other file
 * data is stored on disk to take advantage of Node.js
 */
export interface RawFileObject extends DriveObject, EditableFileObjectProperties {
	/**
	 * Mimicing Google Drive API
	 */
	kind: 'drive#file';
	/**
	 * The file identifier
	 */
	id: string;
	/**
	 * The MIME type for the file
	 */
	contentType: string;
	/**
	 * The UTC unix time stamp of when the file was created
	 */
	created: number;
	/**
	 * ID of the parent for going backwards
	 */
	parentID: string | null;
}

export interface FolderPathItem {
	/**
	 * The ID of the parent folder
	 */
	id: string;
	/**
	 * The name of the parent folder
	 */
	name: string;
}

/**
 * A FileObject the client may like to use
 */
export interface FileObject extends RawFileObject {
	/**
	 * Provided by the file class, not actually stored in the database
	 */
	folderPath: FolderPathItem[];
}

/**
 * A more expensive File object that may provide needed information
 * to the client
 */
export interface FullFileObject extends FileObject {
	uploader: MaybeObj<MemberObject>;
}

export type Timezone =
	| 'America/New_York'
	| 'America/Chicago'
	| 'America/Denver'
	| 'America/Los_Angeles'
	| 'America/Arizona'
	| 'America/Anchorage'
	| 'America/Hawaii'
	| 'America/Puerto_Rico';

export interface WebsiteInformation {
	/**
	 * What the website is called
	 */
	Name: string;
	/**
	 * The full name of the unit
	 */
	UnitName: string;
	/**
	 * -, ::, etc. Personal taste, used in the title of the page
	 */
	Separator: string;
	/**
	 * Controls how many events will show up in the 'upcoming' page
	 */
	ShowUpcomingEventCount: number;
	/**
	 * How many images are downloaded when scrolling in the photo library
	 */
	PhotoLibraryImagesPerPage: number;
	/**
	 * What timezone the unit is operating within
	 */
	Timezone: Timezone;
	/**
	 * The Favicon of the website
	 */
	FaviconID: MaybeObj<string>;
}

/**
 * The website contact information the webmaster may want to set
 *
 * All of this information is currently only used on the footer of
 * the website
 */
export interface WebsiteContact {
	/**
	 * A Facebook handle that may want to be used
	 */
	FaceBook: null | string;
	/**
	 * A Twitter handle
	 */
	Twitter: null | string;
	/**
	 * A link to a YouTube account a squadron may have
	 */
	YouTube: null | string;
	/**
	 * A link to a LinkedIn account that can be used
	 */
	LinkedIn: null | string;
	/**
	 * ditto Instagram
	 */
	Instagram: null | string;
	/**
	 * ditto Flickr
	 */
	Flickr: null | string;
	/**
	 * Invite link for a Discord server
	 */
	Discord: null | string;
	/**
	 * This is the place where normal meetings take place
	 *
	 * Only used for style at the bottom of the page, nothing else actually uses this
	 *
	 * Maybe could be the default place for Events?
	 */
	MeetingAddress: null | {
		Name: string;
		FirstLine: string;
		SecondLine: string;
	};
	/**
	 * The place to mail stuff to, may not necessarily match the meeting address
	 */
	MailingAddress: null | {
		Name: string;
		FirstLine: string;
		SecondLine: string;
	};
}

/**
 * Used to configure the different flights
 */
export interface RankAndFileInformation {
	/**
	 * Describes the flights that an account may field, e.g. Alpha Bravo Charlie Delta
	 */
	Flights: string[];
}

/**
 * Each account has a registry, stores configuration
 */
export interface RegistryValues extends AccountIdentifiable {
	/**
	 * How to contact the account; email, social media, etc;
	 */
	Contact: WebsiteContact;
	/**
	 * Website naming details
	 */
	Website: WebsiteInformation;
	/**
	 * Contains information about the different flights
	 */
	RankAndFile: RankAndFileInformation;
}

/**
 * Change Log / Release Notes Items
 */
export interface ChangeLogItem {
	/**
	 * the date and time the change log was entered
	 */
	entryDateTime: number;
	/**
	 * the CAPID of the person who entered the changelog item
	 */
	entryCAPID: number;
	/**
	 * the date and time the change went into effect
	 */
	noteDateTime: number;
	/**
	 * the title of the changelog item
	 */
	noteTitle: string;
	/**
	 * the textual description of the system change
	 */
	noteText: string;
}

/**
 * A team member being added or modified
 */
export interface NewTeamMember {
	/**
	 * Who is the member?
	 */
	reference: MemberReference;
	/**
	 * What job do they hold?
	 */
	job: string;
}

/**
 * The team member being stored in the database
 */
export interface RawTeamMember extends NewTeamMember {
	/**
	 * When did they join?
	 */
	joined: number;
}

/**
 * Stores a team member who was removed
 */
export interface RawPreviousTeamMember extends RawTeamMember {
	/**
	 * When were they removed?
	 */
	removed: number;
}

/**
 * The full team member sent to the client for display
 */
export interface FullTeamMember extends RawTeamMember {
	/**
	 * Contains the name of the said member
	 */
	name: string;
}

/**
 * The full team member that was removed, sent to the client for display
 */
export interface FullPreviousTeamMember extends RawPreviousTeamMember {
	/**
	 * The name of the team member removed (shame on them)
	 */
	name: string;
}

/**
 * For creating teams of cadets
 */
export interface NewTeamObject {
	/**
	 * All teams need a name, right?
	 */
	name: string;
	/**
	 * Who is on the team
	 */
	members: NewTeamMember[];
	/**
	 * Describe what the team does
	 */
	description: string;
	/**
	 * Who will be leading the team?
	 */
	cadetLeader: MaybeObj<MemberReference>;
	/**
	 * Who will mentor the team?
	 */
	seniorMentor: MaybeObj<MemberReference>;
	/**
	 * Who coaches the team?
	 */
	seniorCoach: MaybeObj<MemberReference>;
	/**
	 * Visbility of team; each one is described by the enum declaration
	 */
	visibility: TeamPublicity;
}

/**
 * Allows for teams of cadets
 */
export interface RawTeamObject extends NewTeamObject, AccountIdentifiable {
	/**
	 * Solidifies the types for the full team object
	 */
	members: RawTeamMember[];
	/**
	 * Teams use numerical IDs
	 *
	 * Allows for incrementation
	 */
	id: number;
	/**
	 * Maintain a history of those who have gone through
	 * a team
	 */
	teamHistory: RawPreviousTeamMember[];
}

/**
 * A change to the RawTeamObject that can be better used for display
 */
export interface FullTeamObject extends RawTeamObject {
	/**
	 * Full team members that contains names
	 */
	members: FullTeamMember[];
	/**
	 * Full team member history that contains names
	 */
	teamHistory: FullPreviousTeamMember[];
	/**
	 * As the cadet leader is not technically a team member,
	 * and their name needs to be sent, this is included
	 */
	cadetLeaderName: MaybeObj<string>;
	/**
	 * As the senior mentor is not technically a team member,
	 * and their name needs to be sent, this is included
	 */
	seniorMentorName: MaybeObj<string>;
	/**
	 * As the senior coach is not technically a team member,
	 * and their name needs to be sent, this is included
	 */
	seniorCoachName: MaybeObj<string>;
}

/**
 * Used to start to send a notification
 */
export interface NewNotificationObject<
	C extends NotificationCause,
	T extends NotificationTarget,
	D extends NotificationData
> {
	/**
	 * What caused this notification?
	 */
	cause: C;
	/**
	 * The data for the notification
	 */
	extraData: D;
	/**
	 * Who is the notification for?
	 */
	target: T;
}

/**
 * A raw notification object is what is stored directly in the database
 */
export interface RawNotificationObject<
	C extends NotificationCause = NotificationCause,
	T extends NotificationTarget = NotificationTarget,
	D extends NotificationData = NotificationData
> extends NewNotificationObject<C, T, D>,
		AccountIdentifiable {
	/**
	 * Used to identify notifications
	 */
	id: number;
	/**
	 * Is the notification handled?
	 */
	archived: boolean;
	/**
	 * Has it been read?
	 */
	read: boolean;
	/**
	 * Whether or not it is ok to send an email
	 */
	emailSent: boolean;
	/**
	 * When the notification was sent
	 */
	created: number;
}

/**
 * Notifications are used to tell members that they need to check stuff
 */
export type NotificationObject<
	C extends NotificationCause = NotificationCause,
	T extends NotificationTarget = NotificationTarget,
	D extends NotificationData = NotificationData
> = RawNotificationObject<C, T, D> &
	(C extends NotificationMemberCause ? { fromMemberName: string } : {}) &
	(T extends NotificationMemberTarget ? { toMemberName: string } : {});

/**
 * This is a notification that comes from another member, e.g. a task
 */
export interface NotificationMemberCause {
	/**
	 * Determines who caused the notification
	 */
	from: MemberReference;
	/**
	 * The name of the person this is from, for rendering purposes
	 */
	fromName: string;
	/**
	 * Determines the type of cause
	 */
	type: NotificationCauseType.MEMBER;
}

/**
 * This is a notification that comes from the system, e.g. CAPWATCH imports
 */
export interface NotificationSystemCause {
	/**
	 * Determines the type of cause
	 */
	type: NotificationCauseType.SYSTEM;
}

/**
 * This is to determine from who the notification is coming from
 */
export type NotificationCause = NotificationMemberCause | NotificationSystemCause;

/**
 * These are for things like being assigned a task
 */
export interface NotificationMemberTarget {
	/**
	 * This is meant for a single member
	 */
	to: MemberReference;
	/**
	 * Determines the group of people to go to
	 */
	type: NotificationTargetType.MEMBER;
}

/**
 * These are notifications for things like personnel file approval
 */
export interface NotificationAdminTarget {
	/**
	 * Determines the group of people to go to
	 */
	type: NotificationTargetType.ADMINS;
	/**
	 * Records to which account the notification goes to
	 */
	accountID: string;
}

/**
 * A banner notification that will show up under breadcrumbs for all users
 *
 * These notifications should be used sparingly
 */
export interface NotificationEveryoneTarget {
	/**
	 * As this is a banner type of notification, this is when the notification expires
	 */
	expires: number;
	/**
	 * Determines the group of people to go to
	 */
	type: NotificationTargetType.EVERYONE;
	/**
	 * The account "everyone" refers to
	 */
	accountID: string;
}

/**
 * This is to determine who should get the notification
 */
export type NotificationTarget =
	| NotificationMemberTarget
	| NotificationAdminTarget
	| NotificationEveryoneTarget;

export type MemberNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = NotificationObject<C, NotificationMemberTarget, D>;
export type AdminNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = NotificationObject<C, NotificationAdminTarget, D>;
export type GlobalNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = NotificationObject<C, NotificationEveryoneTarget, D>;

export type RawMemberNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = RawNotificationObject<C, NotificationMemberTarget, D>;
export type RawAdminNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = RawNotificationObject<C, NotificationAdminTarget, D>;
export type RawGlobalNotification<
	C extends NotificationCause = NotificationCause,
	D extends NotificationData = NotificationData
> = RawNotificationObject<C, NotificationEveryoneTarget, D>;

/**
 *
 */
export interface NotificationDataProspectiveMember {
	type: NotificationDataType.PROSPECTIVEMEMBER;
}

/**
 *
 */
export interface NotificationDataPersonnelFile {
	type: NotificationDataType.PERSONNELFILES;
}

export interface NotificationDataPermissions {
	type: NotificationDataType.PERMISSIONCHANGE;
}

/**
 * Used to denote being added or removed as a POC for an event
 */
export interface NotificationDataEvent {
	type: NotificationDataType.EVENT;

	eventID: number;
	accountID: string;

	delta: 'ADDED' | 'REMOVED';
	eventName: string;
}

/**
 * Used for simple messages
 */
export interface NotificationDataMessage {
	type: NotificationDataType.MESSAGE;

	message: string;
}

/**
 * Union of all
 */
export type NotificationData =
	| NotificationDataProspectiveMember
	| NotificationDataPersonnelFile
	| NotificationDataEvent
	| NotificationDataPermissions
	| NotificationDataMessage;

/**
 * Audit log item stored in the database
 */
export interface RawAuditLogItem {
	/**
	 * What method was it?
	 *
	 * Useful for determining the action
	 */
	method: HTTPRequestMethod;
	/**
	 * Where to?
	 */
	target: string;
	/**
	 * What account was it for?
	 */
	accountID: string;
	/**
	 * Who did it?
	 */
	actor: MaybeObj<MemberReference>;
	/**
	 * When did he/she do it?
	 */
	timestamp: number;
}

// /**
//  * Organizational data as imported from CAPWATCH files
//  */
// export interface RawOrganizationObject extends NHQ.Organization {}

// /**
//  * Organizational data as imported from CAPWATCH files
//  */
// export interface OrganizationObject extends RawOrganizationObject {}

/**
 * These are objects containing the results of people completing their tasks
 */
export interface TaskRecipientsResultsNotDone {
	/**
	 * Whether or not they are done with their task
	 */
	done: false;
	/**
	 * The person tasked
	 */
	tasked: MemberReference;
}

export interface TaskRecipientsResultsDone {
	done: true;

	tasked: MemberReference;

	comments: string;
}

export type TaskRecipientsResults = TaskRecipientsResultsDone | TaskRecipientsResultsNotDone;

/**
 * Tasks are a thing that let people assign each other things to do
 */
export interface RawTaskObject {
	/**
	 * The name of the task
	 */
	name: string;
	/**
	 * Who is assigning this task
	 */
	tasker: MemberReference;
	/**
	 * A description of what is supposed to be done
	 */
	description: string;
}

export interface NewTaskObject extends RawTaskObject {
	/**
	 * This is used to determine who should be assigned the task
	 */
	tasked: MemberReference[];
}

/**
 * A full task object including the ID
 */
export interface TaskObject extends RawTaskObject, AccountIdentifiable {
	/**
	 * The way to identify this task
	 */
	id: number;
	/**
	 * Results from those tasked with this task
	 */
	results: TaskRecipientsResults[];
	/**
	 * Records when the task was assigned
	 */
	assigned: number;
	/**
	 * Whether or not this task should be archived
	 */
	archived: boolean;
}

export type AlgorithmType = 'pbkdf2';

/**
 * Represents the password information stored for a user
 */
export interface AccountPasswordInformation {
	/**
	 * Indicates which algorithm to use for the hashing the password
	 *
	 * May not exist for backwards compatibility, defaults to pbkdf2
	 */
	algorithm?: AlgorithmType;
	/**
	 * Records when the password was set
	 */
	created: number;
	/**
	 * The hashed password
	 */
	password: string;
	/**
	 * The salt used to generate the password hash, in conjunction with the password iteration count
	 */
	salt: string;
	/**
	 * The iteration count is used for password stretching
	 */
	iterations: number;
}

/**
 * Represents how basic account mapping information is stored in our database
 */
export interface UserAccountInformation<T extends MemberReference = MemberReference> {
	/**
	 * The username of a user
	 */
	username: string;
	/**
	 * What the user represents
	 */
	member: T;
	/**
	 * Store a password history for the user
	 */
	passwordHistory: AccountPasswordInformation[];
}

export type SafeUserAccountInformation<T extends MemberReference = MemberReference> = Omit<
	UserAccountInformation<T>,
	'passwordHistory'
> & {
	/**
	 * Don't pass around passwordHistory; this is something that should only be in the database.
	 *
	 * It cannot simply be left at being omitted, due to the sturctural nature of TypeScript, it
	 * can still be passed around without throwing a compile time error
	 */
	passwordHistory: [];
};

export interface PasswordResetTokenInformation {
	/**
	 * When the token expires
	 */
	expires: number;
	/**
	 * The actual token
	 */
	token: string;
	/**
	 * For whom the token belongs
	 */
	username: string;
}

export interface DiscordAccount {
	/**
	 * The ID of the member we are associating with a Event Manager account
	 */
	discordID: string;
	/**
	 * The member who has the Discord account
	 */
	member: MemberReference;
}

export interface ServerConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: number;
	DB_USER: string;
	DB_POOL_SIZE: number;

	GOOGLE_KEYS_PATH: string;

	PORT: number;

	NODE_ENV: string;

	DISCORD_CLIENT_TOKEN?: string;

	DRIVE_STORAGE_PATH: string;

	HOST_NAME: string;

	AWS_ACCESS_KEY_ID: string;
	AWS_SECRET_ACCESS_KEY: string;

	RECAPTCHA_SECRET: string;
}

export interface EnvServerConfiguration {
	DB_HOST: string;
	DB_SCHEMA: string;
	DB_PORT: string;
	DB_POOL_SIZE: string;

	GOOGLE_KEYS_PATH: string;

	PORT: string;

	NODE_ENV: string;

	DRIVE_STORAGE_PATH: string;

	HOST_NAME: string;
}

export interface RawServerConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: string;
	DB_USER: string;
	DB_POOL_SIZE: string;

	GOOGLE_KEYS_PATH: string;

	PORT: string;

	NODE_ENV: string;

	DISCORD_CLIENT_TOKEN?: string;

	DRIVE_STORAGE_PATH: string;

	HOST_NAME: string;

	AWS_ACCESS_KEY_ID: string;
	AWS_SECRET_ACCESS_KEY: string;

	RECAPTCHA_SECRET: string;
}

export interface CLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: number;
	DB_USER: string;
	DB_POOL_SIZE: number;

	GOOGLE_KEYS_PATH: string;

	HOST_NAME: string;

	NODE_ENV: string;

	DISCORD_CLIENT_TOKEN?: string;

	DRIVE_STORAGE_PATH: string;
}

export interface EnvCLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PORT: string;
	DB_POOL_SIZE: string;

	GOOGLE_KEYS_PATH: string;

	HOST_NAME: string;

	NODE_ENV: string;

	DRIVE_STORAGE_PATH: string;
}

export interface RawCLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: string;
	DB_USER: string;
	DB_POOL_SIZE: string;

	GOOGLE_KEYS_PATH: string;

	HOST_NAME: string;

	NODE_ENV: string;

	DISCORD_CLIENT_TOKEN?: string;

	DRIVE_STORAGE_PATH: string;
}

export declare interface MemberUpdateEventEmitter extends EventEmitter {
	on(event: 'capwatchImport', listener: (account: AccountObject) => void): this;
	on(
		event: 'memberChange',
		listener: (info: { member: Member; account: AccountObject }) => void,
	): this;
	on(
		event: 'discordRegister',
		listener: (user: { user: DiscordAccount; account: AccountObject }) => void,
	): this;
	on(
		event: 'teamMemberRemove' | 'teamMemberAdd',
		listener: (info: {
			member: MemberReference;
			team: RawTeamObject;
			account: AccountObject;
		}) => void,
	): this;

	emit(event: 'capwatchImport', account: AccountObject): boolean;
	emit(event: 'memberChange', member: { member: Member; account: AccountObject }): boolean;
	emit(event: 'discordRegister', user: { user: DiscordAccount; account: AccountObject }): boolean;
	emit(
		event: 'teamMemberRemove' | 'teamMemberAdd',
		info: { member: MemberReference; team: RawTeamObject; account: AccountObject },
	): boolean;
}

export type Matcheable<T extends string | number | symbol, V> = {
	[K in T]: V;
};

export interface ParamType {
	[key: string]: string | undefined;
}

export interface BasicMySQLRequest<P extends ParamType = ParamType, B = any> {
	/**
	 * Contains basic properties from express.Request
	 */
	body: B;
	method: string;
	headers: IncomingHttpHeaders;
	originalUrl: string;
	_originalUrl: string;
	hostname: string;

	/**
	 * Contains stuff that is used.
	 *
	 * If the 'extends express.Request' bit above were removed, the only compile time errors that would occur
	 * would be from router.use not accepting this type of request. As such, if deemed necessary, we can
	 * extract code from asyncErrorHandler or asyncEitherHandler and pass it an object such as this and check
	 * the output
	 */
	mysqlx: Schema;
	mysqlxSession: Session;
	params: P;
	configuration: ServerConfiguration;
	memberUpdateEmitter: MemberUpdateEventEmitter;
}

export enum SessionType {
	REGULAR = 'Regular',
	PASSWORD_RESET = 'PasswordReset',
	SCAN_ADD = 'ScanAdd',
	IN_PROGRESS_MFA = 'MFAInProgress',
}

export type SessionForSessionType<
	S extends SessionType,
	M extends MemberReference
> = S extends SessionType.REGULAR
	? RegularSession<M>
	: S extends SessionType.PASSWORD_RESET
	? PasswordResetSession<M>
	: S extends SessionType.IN_PROGRESS_MFA
	? InProgressMFASession<M>
	: ScanAddSession<M>;

export interface ScanAddSession<T extends MemberReference = MemberReference> {
	id: SessionID;
	expires: number;
	userAccount: SafeUserAccountInformation<T>;
	type: SessionType.SCAN_ADD;
	sessionData: {
		accountID: string;
		eventID: number;
	};
}

export interface RegularSession<T extends MemberReference = MemberReference> {
	id: SessionID;
	expires: number;
	userAccount: SafeUserAccountInformation<T>;
	type: SessionType.REGULAR;
}

export interface PasswordResetSession<T extends MemberReference = MemberReference> {
	id: SessionID;
	expires: number;
	userAccount: SafeUserAccountInformation<T>;
	type: SessionType.PASSWORD_RESET;
}

export interface InProgressMFASession<T extends MemberReference = MemberReference> {
	id: SessionID;
	expires: number;
	userAccount: SafeUserAccountInformation<T>;
	type: SessionType.IN_PROGRESS_MFA;
}

export type UserSession<T extends MemberReference = MemberReference> =
	| ScanAddSession<T>
	| RegularSession<T>
	| PasswordResetSession<T>
	| InProgressMFASession<T>;

export type ActiveSession<T extends MemberReference = MemberReference> = UserSession<T> & {
	user: UserForReference<T>;
};

export type AuditableObjects =
	| NewEventObject
	| NewAttendanceRecord
	| EditableFileObjectProperties
	| NewCAPProspectiveMember
	| MemberPermissions;

/**
 * Represents a descriminant that
 */
export type TargetForType<T extends AuditableObjects> = T extends NewEventObject
	? 'Event'
	: T extends NewAttendanceRecord
	? 'Attendance'
	: T extends EditableFileObjectProperties
	? 'File'
	: T extends NewCAPProspectiveMember
	? 'CAPProspectiveMember'
	: T extends MemberPermissions
	? 'Permissions'
	: never;

export type ChangeRepresentation<T> = {
	[P in keyof T]?: {
		oldValue: T[P];
		newValue: T[P];
	};
};

export interface ChangeEvent<T extends AuditableObjects & DatabaseIdentifiable> {
	target: TargetForType<T>;

	actor: MemberReference;

	actorName: string;

	changes: ChangeRepresentation<Omit<T, 'id'>>;

	accountID: string;

	// targetID is the _id property inserted by MySQL
	targetID: string;

	timestamp: number;

	type: AuditableEventType.MODIFY;
}

export interface CreateEvent<T extends AuditableObjects & DatabaseIdentifiable> {
	target: TargetForType<T>;

	actor: MemberReference;

	actorName: string;

	accountID: string;

	// targetID is the _id property inserted by MySQL
	targetID: string;

	timestamp: number;

	type: AuditableEventType.ADD;
}

export interface DeleteEvent<T extends AuditableObjects & DatabaseIdentifiable> {
	target: TargetForType<T>;

	actor: MemberReference;

	actorName: string;

	accountID: string;

	// targetID is the _id property inserted by MySQL
	targetID: string;

	objectData: T;

	timestamp: number;

	type: AuditableEventType.DELETE;
}

export type AuditableEvents<O extends AuditableObjects & DatabaseIdentifiable> =
	| ChangeEvent<O>
	| CreateEvent<O>
	| DeleteEvent<O>;

export type EventAuditEvents = AuditableEvents<FromDatabase<NewEventObject>>;
export type AttendanceAuditEvents = AuditableEvents<FromDatabase<AttendanceRecord>>;
export type FileAuditEvents = AuditableEvents<FromDatabase<EditableFileObjectProperties>>;
export type ProspectiveMemberAudits = AuditableEvents<FromDatabase<NewCAPProspectiveMember>>;
export type PermissionsAudits = AuditableEvents<FromDatabase<MemberPermissions>>;

export type AllAudits = AuditableEvents<AuditableObjects & DatabaseIdentifiable>;

export interface CadetPromotionRequirements {
	/**
	 * The Achievement ID number (integer from 1 to 21)
	 */
	CadetAchvID: number;

	/**
	 * The Achievement name
	 */
	AchvName: string;

	/**
	 * The Rank to promote to
	 */
	Rank: string;

	/**
	 * The grade held by a cadet earning that achievement
	 */
	Grade: string;

	/**
	 * The Achievement "Number" or title
	 */
	AchvNumber: string;

	/**
	 * Is reciting the oath required for this achivement?
	 */
	Oath: boolean;

	/**
	 * The Leadership module required for this achievement
	 */
	Leadership: string;

	/**
	 * Is mentoring required for this achievement?
	 */
	Mentor: boolean;

	/**
	 * Is SDA Service required for this achievement?
	 */
	SDAService: boolean;

	/**
	 * Is SDA Writing assignment required for this achivement?
	 */
	SDAWriting: boolean;

	/**
	 * Is SDA Presentation required for this achievement?
	 */
	SDAPresentation: boolean;

	/**
	 * The Drill module required for this achievement
	 */
	Drill: string;

	/**
	 * The number of drill items required to pass the drill test
	 */
	DrillItemsPass: number;

	/**
	 * The number of total items in the drill test
	 */
	DrillItemsTotal: number;

	/**
	 * The aerospace module required for this achievement
	 */
	Aerospace: string;

	/**
	 * Is Character Development required for this achievement?
	 */
	CharDev: boolean;

	/**
	 * Is Encampment required for this achievement?
	 */
	Encampment: boolean;

	/**
	 * Is RCLS required for this achievement?
	 */
	RCLS: boolean;

	/**
	 * The web page listing the requirements for the achievement
	 */
	ReqsWebLink: string;

	/**
	 * The web page with the leadership test for the achievement
	 */
	LeadTestWebLink: string;

	/**
	 * The web page for the Aerospace Education tests, if required
	 */
	AeroTestWebLink: string;

	/**
	 * The download links for the drill tests for the first 9 achievements
	 */
	DrillTestWebLink: string;
}

export interface CadetPromotionStatus {
	/**
	 * The current highest achievement data
	 */
	CurrentCadetAchv: NHQ.CadetAchv;

	/**
	 * The Achievement ID Number of the current Grade (uses promotionRequirements.ts)
	 */
	CurrentCadetGradeID: number;

	/**
	 * The Achievement ID Number of the NEXT Grade (uses promotionRequirements.ts)
	 */
	NextCadetGradeID: number;

	/**
	 * The Achievement ID Number of the NEXT achievement to complete (0 - 21, NOT the current Achievement ID number)
	 */
	NextCadetAchvID: number;

	/**
	 * The current highest approved achievement status
	 */
	MaxAprvStatus: CadetAprvStatus;

	/**
	 * The date of the last promotion approval
	 */
	LastAprvDate: MaybeObj<number>;

	/**
	 * The date of completion of encampment (required for Mitchell)
	 */
	EncampDate: MaybeObj<number>;

	/**
	 * The date of completion of RCLS (should have Encampment and C/MSgt before eligible)
	 */
	RCLSDate: MaybeObj<number>;

	/**
	 * HFZ information
	 */
	HFZRecord: MaybeObj<NHQ.CadetHFZInformation>;

	/**
	 * Orientation flight information
	 */
	oflights: NHQ.OFlight[];

	/**
	 * GES achievement
	 */
	ges: MaybeObj<NHQ.MbrAchievements>;
}

export interface CadetHFZRequirements {
	/**
	 * Gender
	 */
	Gender: string;

	/**
	 * Age
	 */
	Age: number;

	/**
	 * Pacer Run requirement
	 */
	Pacer: number;

	/**
	 * Mile Run requirement
	 */
	MileRun: string;

	/**
	 * Curl Ups requirement
	 */
	CurlUps: number;

	/**
	 * Push Ups requirement
	 */
	PushUps: number;

	/**
	 * Sit Reach requirement
	 */
	SitReach: number;
}

/**
 * Used to sort members in the appropriate grade order
 */

export interface GradeOrder {
	/**
	 * Member Grade
	 */
	Grade: string;

	/**
	 * Grade Order
	 */
	GradeOrder: number;
}

/**
 * Represents the MFA tokens that are stored for a user
 */

export interface StoredMFASecret {
	/**
	 * The MFA token itself
	 */
	secret: string;

	/**
	 * The user the token belongs to
	 */
	member: MemberReference;
}

export interface SignInLogData {
	/**
	 *
	 */
	memberRef: MemberReference;

	/**
	 *
	 */
	accountID: string;

	/**
	 *
	 */
	lastAccessTime: number;

	/**
	 *
	 */
	accessCount: number;
}
