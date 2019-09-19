import * as DraftJS from 'draft-js';
import {
	AttendanceStatus,
	EchelonEventNumber,
	EventStatus,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	MemberCreateError,
	NotificationCauseType,
	NotificationTargetType,
	PointOfContactType,
	TeamPublicity,
	NotificationDataType,
	CustomAttendanceFieldEntryType
} from './index';
import {
	FlightAssign,
	MusterSheet,
	PTSheet,
	PromotionManagement,
	AssignTasks,
	AdministerPT,
	ManageEvent,
	EventContactSheet,
	ORMOPORD,
	AssignTemporaryDutyPosition,
	ProspectiveMemberManagement,
	EventLinkList,
	ManageTeam,
	FileManagement,
	PermissionManagement,
	DownloadCAPWATCH,
	Notify,
	RegistryEdit
} from './permissions';

type RawDraftContentState = DraftJS.RawDraftContentState;
// Export it so the server can use it and not have to depend on @types/draft-js
// Depending on @types/draft-js causes dependency hell
export { RawDraftContentState };
export namespace Draft {
	export type DraftBlockType = DraftJS.DraftBlockType;
	export type DraftInlineStyleType = DraftJS.DraftInlineStyleType;
	export type RawDraftContentBlock = DraftJS.RawDraftContentBlock;
	export type RawDraftContentState = DraftJS.RawDraftContentState;
	export type RawDraftEntity = DraftJS.RawDraftEntity;
	export type RawDraftEntityRange = DraftJS.RawDraftEntityRange;
	export type RawDraftInlineStyleRange = DraftJS.RawDraftInlineStyleRange;
}

/**
 * Table for SQL definitions for CAP NHQ
 *
 * Documentation is not provided by NHQ
 */
export namespace NHQ {
	export interface CadetAchv {
		CAPID: number;
		CadetAchvID: number;
		PhyFitTest: string;
		LeadLabDateP: string;
		LeadLabScore: number;
		AEDateP: string;
		AEScore: number;
		AEMod: number;
		AETest: number;
		MoralLDateP: string;
		ActivePart: number;
		OtherReq: number;
		SDAReport: number;
		UsrID: string;
		DateMod: string;
		FirstUsr: string;
		DateCreated: string;
		DrillDate: string;
		DrillScore: number;
		LeadCurr: string;
		CadetOath: number;
		AEBookValue: string;
		MileRun: number;
		ShuttleRun: number;
		SitAndReach: number;
		PushUps: number;
		CurlUps: number;
	}

	export interface CadetAchvAprs {
		CAPID: number;
		CadetAchvID: number;
		Status: string;
		AprCAPID: number;
		DspReason: string;
		AwardNo: number;
		JROTCWaiver: number;
		UsrID: number;
		DateMod: string;
		FirstUsr: string;
		DateCreated: string;
		PrintedCert: number;
	}

	/*  CAPID,Type,Location,Completed,UsrID,DateMod  */

	export interface CadetActivities {
		CAPID: number;
		Type: string;
		Location: string;
		Completed: string;
		UsrID: string;
		DateMod: string;
	}

	export interface OFlight {
		CAPID: number;
		Wing: string;
		Unit: string;
		Amount: number;
		Syllabus: number;
		Type: number;
		FltDate: string;
		TransDate: string;
		FltRlsNum: string;
		AcftTailNum: string;
		FltTime: number;
		LstUsr: string;
		LstDateMod: string;
		Comments: string;
	}

	export interface CadetDutyPosition {
		CAPID: number;
		Duty: string;
		FunctArea: string;
		Lvl: string;
		Asst: number;
		UsrID: string;
		DateMod: string;
		ORGID: number;
	}

	export interface DutyPosition {
		CAPID: number;
		Duty: string;
		FunctArea: string;
		Lvl: string;
		Asst: number;
		UsrID: string;
		DateMod: string;
		ORGID: number;
	}

	export interface MbrContact {
		CAPID: number;
		Type: CAPMemberContactType;
		Priority: CAPMemberContactPriority;
		Contact: string;
		UsrID: string;
		DateMod: string;
		DoNotContact: number;
	}

	export interface Member {
		CAPID: number;
		SSN: '';
		NameLast: string;
		NameFirst: string;
		NameMiddle: string;
		NameSuffix: string;
		Gender: string;
		DOB: string;
		Profession: string;
		EducationLevel: string;
		Citizen: string;
		ORGID: number;
		Wing: string;
		Unit: string;
		Rank: string;
		Joined: string;
		Expiration: string;
		OrgJoined: string;
		UsrID: string;
		DateMod: string;
		LSCode: string;
		Type:
			| 'NULL'
			| 'CADET'
			| 'CADET SPONSOR'
			| 'SENIOR'
			| 'PATRON'
			| 'FIFTY YEAR'
			| 'FiftyYear'
			| 'INDEFINITE'
			| 'LIFE'
			| 'PATRON'
			| 'STATE LEG';
		RankDate: string;
		Region: string;
		MbrStatus: string;
		PicStatus: string;
		PicDate: string;
		CdtWaiver: string;
	}

	export interface OrgAddresses {
		ORGID: number;
		Wing: string;
		Unit: string;
		Type: string;
		Priority: string;
		Addr1: string;
		Addr2: string;
		City: string;
		State: string;
		Zip: string;
		Latitude: string;
		Longitude: string;
		UsrID: string;
		DateMod: string;
	}

	export interface Organization {
		ORGID: number;
		Region: string;
		Wing: string;
		Unit: string;
		NextLevel: number;
		Name: string;
		Type: string;
		DateChartered: string;
		Status: string;
		Scope: string;
		UsrID: string;
		DateMod: string;
		FirstUsr: string;
		DateCreated: string;
		DateReceived: string;
		OrgNotes: string;
	}

	export interface OrgContact {
		ORGID: number;
		Wing: string;
		Unit: string;
		Type: string;
		Priority: string;
		Contact: string;
		UsrID: string;
		DateMod: string;
	}

	export interface OrgMeetings {
		ORGID: number;
		Wing: string;
		Unit: string;
		MeetTime: string;
		MeetDay: string;
		ActivityDate: string;
		Descr: string;
		UsrID: string;
		DateMod: string;
	}

	export interface Achievements {
		AcvhID: string;
		Achv: string;
		FunctionalArea: string;
	}

	export interface MbrAchievements {
		CAPID: number;
		AchvID: number;
		Status: 'ACTIVE' | 'EXPIRED' | 'NOT APPROVED' | 'PENDING' | 'TRAINING';
		OriginallyAccomplished: number;
		Completed: number;
		Expiration: number;
		AuthByCAPID: number;
		AuthReason: string;
		AuthDate: number;
		Source: string;
		RecID: number;
		FirstUsr: string;
		DateCreated: number;
		UsrID: string;
		DateMod: number;
		ORGID: number;
	}
}

// Omit taken from https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type HTTPRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Allows for compiling of for-await-of loops
 */
export interface AsyncIterableIterator<T> {
	next(value?: any): Promise<IteratorResult<T>>;
	return?(value?: any): Promise<IteratorResult<T>>;
	throw?(e?: any): Promise<IteratorResult<T>>;
}

export namespace global {
	export interface AsyncIterableIterator<T> {
		next(value?: any): Promise<IteratorResult<T>>;
		return?(value?: any): Promise<IteratorResult<T>>;
		throw?(e?: any): Promise<IteratorResult<T>>;
	}
}

/**
 * As the return types are complex, keeping them consistent is key
 */
export type MultCheckboxReturn = [boolean[], string];
export type RadioReturn<T extends number> = [T, string];

/**
 * Provides some consistency in type information at least
 */
export type SessionID = string;

/**
 * Mark documents as NoSQL, for interaction with the database
 *
 * But not too close, because an object may not have been created and
 * therefore not have an _id
 */
export interface NoSQLDocument {
	/**
	 * The ID assigned by NoSQL/MySQL
	 */
	_id?: string;
}

/**
 * Used by certain classes to say this object can't be undefined. NoSQLDocument
 * is used when the object is being created and information cannot be known about
 * it
 */
export type FullDBObject<T extends NoSQLDocument> = T & Required<NoSQLDocument>;

/**
 * Most classes interact with the database in some way; just define some
 * common ground for them
 */
export interface DatabaseInterface<T extends NoSQLDocument> {
	/**
	 * Return the object in a manner that is safe for JSON transfer
	 *
	 * Useful for when making sure the wrong data doesn't get transferred
	 * to the client
	 */
	toRaw(): { [P in Exclude<keyof T, '_id'>]: T[P] };
	/**
	 * Save the document to the database
	 */
	save(): Promise<void>;
	/**
	 * All database interfaces should implement the object they
	 * are interfaces for, and need a standard for `_id`s
	 */
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

export type ErrorType = 'Server' | 'Client';

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
	 * If resolved, it does not display
	 */
	resolved: boolean;
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
export interface ServerErrorObject extends ErrorObject, NoSQLDocument, Identifiable {
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
	payload: any;
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
export interface ClientErrorObject extends NewClientErrorObject, NoSQLDocument, Identifiable {
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

export type Errors = ClientErrorObject | ServerErrorObject;

export interface HTTPError {
	/**
	 * A simple way to return errors as per the W3C spec
	 */
	errorMessage: string;
}

/**
 * Used when requesting or editing an account
 */
export interface NewAccountObject {
	/**
	 * CAP IDs of the admins of this account
	 */
	adminIDs: MemberReference[];
}

/**
 * The raw account object stored in the database
 *
 * Doesn't contain simple boolean values for if it has expired and such, these are
 * put in the FullAccountObject that gets expanded upon and used more in practice
 */
export interface RawAccountObject extends Identifiable, NoSQLDocument, NewAccountObject {
	/**
	 * The Account ID
	 */
	id: string;
	/**
	 * Whether or not the account is an echelon account
	 */
	echelon: boolean;
	/**
	 * The main organization of the account
	 */
	mainOrg: number;
	/**
	 * The ids of the organizations
	 */
	orgIDs: number[];
	/**
	 * Whether the account is a paid account
	 */
	paid: boolean;
	/**
	 * Datetime when the account expires in
	 */
	expires: number;
	/**
	 * How many events can be used if this account is paid for
	 */
	paidEventLimit: number;
	/**
	 * How many events can be used if this account is unpaid for
	 */
	unpaidEventLimit: number;
}

/**
 * The object that splits all of the data used by different people to limit their views
 * to what they want and what they have permissions for
 */
export interface AccountObject extends RawAccountObject {
	/**
	 * Whether the account is a valid paid account
	 *
	 * Valid paid means it is paid for and not expired
	 */
	validPaid: boolean;
	/**
	 * Whether the account is expired
	 */
	expired: boolean;
}

/**
 * A blog post for peoplle to read
 */
export interface BlogPostObject extends AccountIdentifiable, NoSQLDocument, NewBlogPost {
	/**
	 * The ID of the blog post itself
	 */
	id: number;
	/**
	 * When it was published
	 */
	posted: number;
	/**
	 * The author of the blog post
	 */
	author: MemberReference;
}

/**
 * The blog post object that is sent to the client that can be used to its fullest
 */
export interface FullBlogPostObject extends BlogPostObject {
	/**
	 * Full author name for display
	 */
	authorName: string;
}

/**
 * This is what the client and the server use to create and edit blog posts
 */
export interface NewBlogPost {
	/**
	 * The title of the blog post
	 */
	title: string;
	/**
	 * What the author is trying to say
	 */
	content: RawDraftContentState;
}

/**
 * Used by full blog pages to represent provide enough representation of parents that
 * can be used for better rendering
 */
export interface BlogPageAncestryItem {
	/**
	 * The name of the ancestor, for display
	 */
	title: string;
	/**
	 * The ID of the ancestor, for linking to the page
	 */
	id: string;
}

/**
 * Used when creating a blog page
 *
 * Really simple, not much is needed
 */
export interface NewBlogPage {
	/**
	 * The title of the page
	 */
	title: string;
	/**
	 * The page content
	 */
	content: RawDraftContentState;
}

/**
 * The raw blog page object stored in the Database
 */
export interface BlogPageObject extends AccountIdentifiable, NewBlogPage, NoSQLDocument {
	/**
	 * The id of the page, to get it by
	 */
	id: string;
	/**
	 * Each blog page can have a set of children
	 *
	 * This contains an array to references of BlogPages
	 */
	children: string[];
	/**
	 * The page that has this as a child
	 */
	parentID: string | null;
}

/**
 * The full blog page object transfered from the server to the client
 *
 * It contains extra information pertinent to rendering
 */
export interface FullBlogPageObject extends BlogPageObject {
	/**
	 * Used for advanced navigation
	 */
	ancestry: BlogPageAncestryItem[];
	/**
	 * Used for advanced navigation
	 */
	fullChildren: BlogPageAncestryItem[];
}

/**
 * Debriefs for the various events that every member can submit
 *
 * This allows for others to look back on an event and ask what went
 * well, what could have gone better, etc
 */
export interface DebriefItem {
	/**
	 * Reference for the member submitting the debrief item
	 */
	memberRef: MemberReference;
	/**
	 * The date and time the item was submitted
	 */
	timeSubmitted: number;
	/**
	 * The debrief item text
	 */
	debriefText: string;
}

export interface RawEventObject extends AccountIdentifiable, NoSQLDocument, NewEventObject {
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
	/**
	 * Who to contact for more event information
	 */
	pointsOfContact: Array<InternalPointOfContact | ExternalPointOfContact>;
	/**
	 * If this is a linked event this will be present
	 *
	 * Linking events allows for one account to copy an event of another account
	 * and receive updates and such
	 */
	sourceEvent: null | {
		/**
		 * ID of the event it came from
		 */
		id: number;
		/**
		 * The account linked from
		 */
		accountID: string;
	};
}

/**
 * The meat of what this website is designed for; events can be signed up for
 * and hold information to facilitate easy information distribution
 */
export interface EventObject extends RawEventObject {
	/**
	 * New events start with no attendance, but there can be procedurally
	 * generated attendance on the client side to include internal POCs
	 */
	attendance: AttendanceRecord[];
	/**
	 * Who to contact for more event information
	 */
	pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;
	/**
	 * Custom fields for attendance records
	 */
	customAttendanceFields: Array<CustomAttendanceField>;
}

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
	 * The uniforms that can be worn
	 */
	uniform: MultCheckboxReturn;
	/**
	 * How many people we want at the event
	 */
	desiredNumberOfParticipants: number;
	/**
	 * If there is a registration deadline, this is present
	 * As it is partial, not required information, this may be
	 * excluded
	 */
	registration: null | {
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
	participationFee: null | {
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
	 * Describes the options for meals
	 */
	mealsDescription: MultCheckboxReturn;
	/**
	 * Describes where cadets may be sleeping
	 */
	lodgingArrangments: MultCheckboxReturn;
	/**
	 * Describes how strenuous the activity may be to cadets
	 */
	activity: MultCheckboxReturn;
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
	requiredForms: MultCheckboxReturn;
	/**
	 * Comments from the event author, description, etc.
	 */
	comments: string;
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
	 * If the wing calendar needs to have this event, publish to the Google calendar
	 */
	publishToWingCalendar: boolean;
	/**
	 * Show on the upcoming events portion of the main page
	 */
	showUpcoming: boolean;
	/**
	 * Is there a valid group number available?
	 */
	groupEventNumber: RadioReturn<EchelonEventNumber>;
	/**
	 * What is the wing event number
	 */
	wingEventNumber: RadioReturn<EchelonEventNumber>;
	/**
	 * What is the region event number
	 */
	regionEventNumber: RadioReturn<EchelonEventNumber>;
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
	pointsOfContact: (InternalPointOfContact | ExternalPointOfContact)[];
	/**
	 * Custom fields for attendance records
	 */
	customAttendanceFields: (CustomAttendanceField)[];
	/**
	 * Can cadets sign up for only a portion of the event?
	 */
	signUpPartTime: boolean;
	/**
	 * If this is a team event, a team can be specified for future features
	 */
	teamID: number | null;
	/**
	 * Limit sign ups to team members
	 *
	 * Only required if a team is selected
	 */
	limitSignupsToTeam: boolean | null;
	/**
	 * Files that may be associated with the event; e.g. forms
	 */
	fileIDs: string[];
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
	/**
	 * Whether or not PAOs can use the photos of the attendee
	 */
	canUsePhotos: boolean;

	// If these are undefined, they are staying for the whole event
	/**
	 * If they are comming part time, this shows when they arrive
	 */
	arrivalTime: number | null;
	/**
	 * If they are comming part time, this shows when they depart
	 */
	departureTime: number | null;
	/**
	 * A new attendance record may contain this if someone tries to
	 * add someone else
	 *
	 * Only succeeds if they have the permission to do so
	 */
	memberID?: MemberReference;
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
	 *
	 * SHOULD use the MemberBase.getFullName() function to calculate this,
	 * as this works across the different classes
	 */
	memberName: string;
	/**
	 * Whether or not the emails for this cadet/for the POCs have been sent
	 */
	summaryEmailSent: boolean;
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
 * The member contact info for a user
 *
 * We think it can only be a string, as it is hard (impossible?) to input
 * multiple contacts of a certain type through the UI provided on NHQ
 */
export interface CAPMemberContactInstance {
	/**
	 * First contact to try and raise
	 */
	PRIMARY?: string;
	/**
	 * Second contact to try and raise
	 */
	SECONDARY?: string;
	/**
	 * Only used for emergency; go through the primary and secondary
	 * contacts first
	 */
	EMERGENCY?: string;
}

/**
 * Contains all the contact info for the member, according to NHQ
 */
export interface CAPMemberContact {
	/**
	 * A contact method to use to get in touch with the member
	 */
	ALPHAPAGER: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	ASSISTANT: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	CADETPARENTEMAIL: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	CADETPARENTPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	CELLPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	DIGITALPAGER: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	EMAIL: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	HOMEFAX: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	HOMEPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	INSTANTMESSAGER: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	ISDN: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	RADIO: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	TELEX: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	WORKFAX: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	WORKPHONE: CAPMemberContactInstance;
}

/**
 * Used for looping through the contact types
 */
export type CAPMemberContactType = keyof CAPMemberContact;

/**
 * Used for getting priorities and such
 */
export type CAPMemberContactPriority = keyof CAPMemberContactInstance;

/**
 * The permissions list for various members
 */
export interface MemberPermissions {
	// Start the Cadet Staff permissions
	/**
	 * Whether or not the user can assign flight members
	 */
	FlightAssign: FlightAssign;
	/**
	 * Whether or not the user can get the muster sheet
	 */
	MusterSheet: MusterSheet;
	/**
	 * Whether or not the user can get PT sheets
	 */
	PTSheet: PTSheet;
	/**
	 * Whether or not the user can manage promotions
	 */
	PromotionManagement: PromotionManagement;
	/**
	 * Whether or not the user can assign tasks
	 */
	AssignTasks: AssignTasks;
	/**
	 * Whether or not the user can administer PT
	 */
	AdministerPT: AdministerPT;

	// Start Manager permissions
	/**
	 * Whether or not the user can manage events and to what degree
	 */
	ManageEvent: ManageEvent;
	/**
	 * Whether or not the user can get event contact information
	 */
	EventContactSheet: EventContactSheet;
	/**
	 * Whether or not the user can get ORM OPORD information
	 */
	ORMOPORD: ORMOPORD;
	/**
	 * Whether or not the user can assign temporary duty positions
	 */
	AssignTemporaryDutyPositions: AssignTemporaryDutyPosition;

	// Admin privileges
	/**
	 * Whether or not the user can manage prospective members
	 */
	ProspectiveMemberManagement: ProspectiveMemberManagement;
	/**
	 * Whether or not the user can view a list of all events
	 */
	EventLinkList: EventLinkList;
	/**
	 * Whether or not the user can add a team
	 */
	ManageTeam: ManageTeam;
	/**
	 * Whether or not the user can manage files
	 */
	FileManagement: FileManagement;
	/**
	 * Whether or not the user can manage permissions of others
	 */
	PermissionManagement: PermissionManagement;
	/**
	 * Whether or not the user can download CAPWATCH files
	 */
	DownloadCAPWATCH: DownloadCAPWATCH;
	/**
	 * Whether or not the member can create banner notifications
	 */
	CreateNotifications: Notify;

	// Developer/super admin privileges?
	// Will change when utilities are more user friendly
	/**
	 * Whether or not the user can edit the registry
	 */
	RegistryEdit: RegistryEdit;
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
 * String representation of permissions
 */
export type MemberPermission = keyof MemberPermissions;

/**
 * String representation of the member type, as there needs to be a way to differentiate
 */
export type MemberType = CAPMemberType;

/**
 * Information stored about a member in our database
 *
 * Does not include permission information, which is stored seperately
 * This is so that permissions can be on an account basis
 */
export interface RawMemberObject extends Identifiable {
	/**
	 * The CAPID of the member
	 */
	id: number | string;
	/**
	 * Contact information for the user
	 */
	contact: CAPMemberContact;
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
	 * User login ID
	 */
	usrID: string;
	/**
	 * The type of user, as there are multiple
	 */
	type: MemberType;
	/**
	 * Used to easily reference teams
	 */
	teamIDs: number[];
	/**
	 * Shows how long the member is absent for
	 *
	 * Should not be used if null or if the time has passed
	 */
	absenteeInformation: AbsenteeInformation | null;
}

/**
 * Describes a member
 *
 * CAPWATCHMember and NHQMember have their sources in NHQ
 * ProspectiveMembers are located in our database
 */
export interface MemberObject extends RawMemberObject {
	/**
	 * Tells what the member can do
	 */
	permissions: MemberPermissions;
}

/**
 * Users are different in that they are actively using the website right now,
 * and they have a session. They also have created an account with us
 *
 * This is important because this means they have a session ID and permissions
 */
export interface UserObject extends MemberObject {
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
 * A descriminator type used to help determine what the type of object is
 */
export type CAPMemberType = 'CAPNHQMember' | 'CAPProspectiveMember';

/**
 * These are common to all CAPMembers, not necessarily all members
 */
export interface RawCAPMember extends RawMemberObject {
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
}

/**
 * Descriminant for the short duty position
 */
export type ShortDutyPositionType = 'CAPUnit' | 'NHQ';

/**
 * Short duty positions for use by CAPUnit.com
 */
export interface ShortCAPUnitDutyPosition {
	/**
	 * Represents the duty assigned
	 */
	duty: string;
	/**
	 * Represents the date it was assigned
	 */
	date: number;
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
	 * Shows what the member is allowed to do
	 */
	permissions: MemberPermissions;
}

/**
 * The preferable version of CAPMember, as it is returned from NHQMember and contains
 * the most up to date information and has a specific type
 */
export interface NHQMemberObject extends CAPMemberObject {
	/**
	 * Strict CAP IDs are six digit numbers
	 */
	id: number;
	/**
	 * Descriminant
	 */
	type: 'CAPNHQMember';
	/**
	 * When the membership lapses for this member
	 */
	expirationDate: number;
}

/**
 * The information we store in our database is represented as such
 */
export interface RawProspectiveMemberObject
	extends RawCAPMember,
		AccountIdentifiable,
		NoSQLDocument {
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
	 * Prospective member duty positions are stored in the database
	 *
	 * There is no way to modify this
	 */
	dutyPositions: ShortDutyPosition[];
}

/**
 * A full ProspectiveMember is similar to a CAPMember
 */
export interface ProspectiveMemberObject extends RawProspectiveMemberObject, CAPMemberObject {
	/**
	 * Prospective members have string IDs
	 */
	id: string;
	/**
	 * Typescript deliminator
	 */
	type: 'CAPProspectiveMember';
	/**
	 * Shows what the member is allowed to do
	 */
	permissions: MemberPermissions;
}

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
export interface ProspectiveMemberReference extends MemberReferenceBase {
	type: 'CAPProspectiveMember';
	id: string;
}

/**
 * NHQMemberReference refers to a NHQMember
 */
export interface NHQMemberReference extends MemberReferenceBase {
	type: 'CAPNHQMember';
	id: number;
}

/**
 * The NullMemberReference is used when for initial form values
 *
 * Should be filtered out
 * The various createCorrectMemberObject functions handle this,
 * returning null or throwing an error
 */
export interface NullMemberReference {
	type: 'Null';
}

/**
 * Union type to allow for referring to both NHQMembers and ProspectiveMembers
 */
export type MemberReference = NHQMemberReference | ProspectiveMemberReference | NullMemberReference;

/**
 * In the case that it doesn't like MemberBase, try using Member
 */
export type Member = ProspectiveMemberObject | NHQMemberObject;

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
export interface ExtraMemberInformation extends NoSQLDocument {
	/**
	 * The member this information belongs to
	 */
	member: MemberReference;
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
	member: Member;
	/**
	 * The ID for the session
	 */
	sessionID: string;
	/**
	 * Used by TypeScript/JavaScript to allow for type inference
	 * between success and failure
	 */
	valid: true;
	/**
	 * Returns the amount of notifications the member has
	 */
	notificationCount: number;
	/**
	 * Returns the amount of unfinished tasks the member has
	 */
	taskCount: number;
}

/**
 * Can't simply return null, need to return information as to why
 * things failed
 */
export interface FailedSigninReturn {
	/**
	 * May contain error details
	 */
	error: MemberCreateError;
	/**
	 * The member cannot exist as the signin failed
	 */
	member: null;
	/**
	 * Session ID for an invalid session is empty
	 */
	sessionID: '';
	/**
	 * Used by TypeScript/JavaScript to allow for type inference
	 * between success and failure
	 */
	valid: false;
	/**
	 * As the member sign in failed, this should be 0
	 */
	notificationCount: 0;
	/**
	 * As the member sign in failed, this should be 0
	 */
	taskCount: 0;
}

/**
 * Allows for multiplexing the data together but still have type inference and
 * not use try/catch
 */
export type SigninReturn = SuccessfulSigninReturn | FailedSigninReturn;

/**
 * Used by the different files to indicate what they are
 *
 * Follows the example of Google APIs
 */
export interface DriveObject extends AccountIdentifiable, NoSQLDocument {
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
	 * Children ids for folder
	 */
	fileChildren: string[];
	/**
	 * ID of the parent for going backwards
	 */
	parentID: string | null;
}

/**
 * A FileObject the client may like to use
 */
export interface FileObject extends RawFileObject {
	/**
	 * Provided by the file class, not actually stored in the database
	 */
	folderPath: Array<{
		id: string;
		name: string;
	}>;
}

/**
 * A more expensive File object that may provide needed information
 * to the client
 */
export interface FullFileObject extends FileObject {
	uploader: MemberObject;
}

export interface WebsiteInformation {
	/**
	 * What the website is called
	 */
	Name: string;
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
export interface RegistryValues extends NoSQLDocument, AccountIdentifiable {
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
	cadetLeader: MemberReference | NullMemberReference;
	/**
	 * Who will mentor the team?
	 */
	seniorMentor: MemberReference | NullMemberReference;
	/**
	 * Who coaches the team?
	 */
	seniorCoach: MemberReference | NullMemberReference;
	/**
	 * Visbility of team; each one is described by the enum declaration
	 */
	visibility: TeamPublicity;
}

/**
 * Allows for teams of cadets
 */
export interface RawTeamObject extends NewTeamObject, AccountIdentifiable, NoSQLDocument {
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
	cadetLeaderName: string;
	/**
	 * As the senior mentor is not technically a team member,
	 * and their name needs to be sent, this is included
	 */
	seniorMentorName: string;
	/**
	 * As the senior coach is not technically a team member,
	 * and their name needs to be sent, this is included
	 */
	seniorCoachName: string;
}

/**
 * Used to start to send a notification
 */
export interface NewNotificationObject {
	/**
	 * What caused this notification?
	 */
	cause: NotificationCause;
	/**
	 * What should the notification say?
	 */
	text: string;
	/**
	 * Some extra data to make the viewer more accessible
	 */
	extraData: NotificationData | null;
}

/**
 * A raw notification object is what is stored directly in the database
 */
export interface RawNotificationObject
	extends NewNotificationObject,
		AccountIdentifiable,
		NoSQLDocument {
	/**
	 * Used to identify notifications
	 */
	id: number;
	/**
	 * Who is the notification for?
	 */
	target: NotificationTarget;
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
export interface NotificationObject extends RawNotificationObject {
	fromMemberName: string | null;
	toMemberName: string | null;
}

/**
 * This is a notification that comes from another member, e.g. a task
 */
export interface NotificationMemberCause {
	/**
	 * Determines who caused the notification
	 */
	from: MemberReference;
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
 * Union of all
 */
export type NotificationData =
	| NotificationDataProspectiveMember
	| NotificationDataPersonnelFile
	| NotificationDataEvent
	| NotificationDataPermissions;

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
	actor: MemberReference;
	/**
	 * When did he/she do it?
	 */
	timestamp: number;
}

/**
 * A full audit log item that is expanded upon
 */
export interface AuditLogItem extends RawAuditLogItem {}

/**
 * These are objects containing the results of people completing their tasks
 */
export interface TaskRecipientsResults {
	/**
	 * Whether or not they are done with their task
	 */
	done: boolean;
	/**
	 * The person tasked
	 */
	tasked: MemberReference;
	/**
	 * Comments about the task results the tasked person may have
	 */
	comments: string;
}

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
export interface TaskObject extends RawTaskObject, AccountIdentifiable, NoSQLDocument {
	/**
	 * The way to identify this task
	 */
	id: number;
	/**
	 * Results from those tasked with this task
	 */
	results: Array<TaskRecipientsResults>;
	/**
	 * Records when the task was assigned
	 */
	assigned: number;
	/**
	 * Whether or not this task should be archived
	 */
	archived: boolean;
}

/**
 * Represents the password information stored for a user
 */
export interface AccountPasswordInformation {
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
export interface UserAccountInformation extends NoSQLDocument {
	/**
	 * The username of a user
	 */
	username: string;
	/**
	 * What the user represents
	 */
	member: MemberReference;
	/**
	 * Store a password history for the user
	 */
	passwordHistory: AccountPasswordInformation[];
}
