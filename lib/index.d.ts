import { RawDraftContentState } from 'draft-js';

declare global {
	export type MultCheckboxReturn = [boolean[], string | undefined];

	export const enum EventStatus {
		DRAFT,
		TENTATIVE,
		CONFIRMED,
		COMPLETE,
		CANCELLED,
		INFORMATIONONLY
	}

	export interface PointOfContact {
		email: string;
		phone: string;
		receiveUpdates: boolean;
		receiveRoster: boolean;
		receiveEventUpdates: boolean;
		receiveSignUpUpdates: boolean;
	}

	export interface InternalPointOfContact extends PointOfContact {
		type: 'internal'
		id: number;
	}

	export interface ExternalPointOfContact extends PointOfContact {
		type: 'external'
		name: string;
	}

	export interface NoSQLDocument {
		_id?: string;
	}

	export interface Identifiable {
		id: string | number;
	}
	
	export interface AccountIdentifiable extends Identifiable {
		/**
		 * The ID of the account the folder belongs to
		 */
		accountID: string;
	}
	
	export enum MemberCreateError {
		INCORRECT_CREDENTIALS,
		PASSWORD_EXPIRED
	}
	
	export enum MemberCAPWATCHErrors {
		INVALID_PERMISSIONS,
		NO_NHQ_ACTION
	}
	
	export interface MemberContactInstance {
		PRIMARY: string;
		SECONDARY: string;
		EMERGENCY: string;
	}
	
	export type MemberAccessLevel = 'Member' | 'Staff' | 'Manager' | 'Admin';
	
	/**
	 * Contains all the contact info for the member, according to NHQ
	 */
	export interface MemberContact {
		/**
		 * A contact method to use to get in touch with the member
		 */
		ALPHAPAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		ASSISTANT: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CADETPARENTEMAIL: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CADETPARENTPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CELLPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		DIGITALPAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		EMAIL: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		HOMEFAX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		HOMEPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		INSTANTMESSAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		ISDN: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		RADIO: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		TELEX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		WORKFAX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		WORKPHONE: MemberContactInstance;
	}
	
	export type MemberContactType = keyof MemberContact;
	
	export type MemberContactPriority = keyof MemberContactInstance;
	
	export interface MemberPermissions {
		// Start the Cadet Staff permissions
		/**
		 * Whether or not the user can assign flight members
		 */
		FlightAssign: number;
		/**
		 * Whether or not the user can get the muster sheet
		 */
		MusterSheet: number;
		/**
		 * Whether or not the user can get PT sheets
		 */
		PTSheet: number;
		/**
		 * Whether or not the user can manage promotions
		 */
		PromotionManagement: number;
		/**
		 * Whether or not the user can assign tasks
		 */
		AssignTasks: number;
		/**
		 * Whether or not the user can administer PT
		 */
		AdministerPT: number;
		/**
		 * Whether or not the user can download the cadet staff guide
		 */
		DownloadStaffGuide: number;
		
		// Start Manager permissions
		/**
		 * Whether or not the user can add an event
		 * 1 for they can add a draft event only
		 * 2 for full access
		 */
		AddEvent: number;
		/**
		 * Whether or not the user can 
		 */
		EditEvent: number;
		/**
		 * Whether or not the user can get event contact information
		 */
		EventContactSheet: number;
		/**
		 * Whether or not the user can edit sign up information
		 */
		SignUpEdit: number;
		/**
		 * Whether or not the user can copy events
		 */
		CopyEvent: number;
		/**
		 * Whether or not the user can get ORM OPORD information
		 */
		ORMOPORD: number;
		/**
		 * Whether or not the user can delete events
		 */
		DeleteEvent: number;
		/**
		 * Whether or not the user can assign positions
		 */
		AssignPosition: number;
		
		// Admin privileges
		/**
		 * Whether or not the user can get the event status page
		 */
		EventStatusPage: number;
		/**
		 * Whether or not the user can manage prospective members
		 */
		ProspectiveMemberManagment: number;
		/**
		 * Whether or not the user can view a list of all events
		 */
		EventLinkList: number;
		/**
		 * Whether or not the user can add a team
		 */
		AddTeam: number;
		/**
		 * Whether or not the user can edit a team
		 */
		EditTeam: number;
		/**
		 * Whether or not the user can manage files
		 */
		FileManagement: number;
		/**
		 * Whether or not the user can manage permissions of others
		 */
		PermissionManagement: number;
		/**
		 * Whether or not the user can download CAPWATCH files
		 */
		DownloadCAPWATCH: number;
		
		// Developer/super admin privileges?
		/**
		 * Whether or not the user can edit the registry
		 */
		RegistryEdit: number;
	
		// To get it to not throw errors
		[key: string]: number;
	}
	
	export type MemberPermission = keyof MemberPermissions;
	
	/**
	 * Describes a CAP member
	 * 
	 * The member may be created from one of three ways:
	 * 
	 * Member.Create: Takes sign in data and signs the user in
	 * Member.Check: Takes a session id and returns the user
	 * Member.Estimate: Estimates the user based off of CAPWATCH data
	 */
	export interface MemberObject extends Identifiable {
		/**
		 * The CAPID of the member
		 */
		id: number;
		/**
		 * The rank of the member provided
		 */
		memberRank: string;
		/**
		 * Whether or not the member is a senior member
		 */
		seniorMember: boolean;
		/**
		 * Contact information for the user
		 */
		contact: MemberContact;
		/**
		 * Duty positions listed on CAP NHQ, along with temporary ones assigned here
		 */
		dutyPositions: string[];
		/**
		 * The Squadron a member belongs to
		 */
		squadron: string;
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
		 * Which flight the user is in. Should only exist if not a senior member
		 */
		flight?: string;
	}

	interface TemporaryDutyPosition {
		validUntil: number;

		Duty: string;
	}

	export interface ExtraMemberInformation extends AccountIdentifiable, NoSQLDocument {
		/**
		 * CAPID
		 */
		id: number;
		/**
		 * Extra duty positions that are assigned to the member
		 */
		temporaryDutyPositions: TemporaryDutyPosition[];
		/**
		 * Access level for the member
		 */
		accessLevel: MemberAccessLevel;
	}
	
	export interface AccountObject extends Identifiable, NoSQLDocument {
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
		 * Whether the account is a valid paid account
		 * 
		 * Valid paid means it is paid for and not expired
		 */
		validPaid: boolean;
		/**
		 * Whether the account is expired
		 */
		expired: boolean;
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
		/**
		 * CAP IDs of the admins of this account
		 */
		adminIDs: number[];
	}
	
	export interface DriveObject extends AccountIdentifiable, NoSQLDocument {
		/**
		 * The kind of object it is, as these pass through JSON requests
		 */
		kind: string;
	}
	
	export interface FileObject extends DriveObject {
		/**
		 * Prevent duck typing to an extent
		 */
		kind: 'drive#file';
		/**
		 * The file identifier
		 */
		id: string;
		/**
		 * The id of the uploader
		 */
		uploaderID: number;
		/**
		 * The name of the file
		 */
		fileName: string;
		/**
		 * Comments about the file
		 */
		comments: string;
		/**
		 * The MIME type for the file
		 */
		contentType: string;
		/**
		 * The UTC unix time stamp of when the file was created
		 */
		created: number;
		/**
		 * Whether or not the file is limited to the members
		 */
		memberOnly: boolean;
		/**
		 * Whether or not the file is displayed in the photo library (only works with photos)
		 */
		forDisplay: boolean;
		/**
		 * Whether or not the file is to be shown in the slideshow
		 */
		forSlideshow: boolean;
		/**
		 * Child ids
		 */
		fileChildren: string[];
		/**
		 * ID of the parent for going backwards
		 */
		parentID: string;
	}
	
	export interface BlogPost extends AccountIdentifiable, NoSQLDocument, NewBlogPost {
		id: number;
	}

	export interface NewBlogPost {
		title: string;
		authorid: number;
		content: RawDraftContentState;
		fileIDs: string[];
		posted: number;
	}

	export interface EventObject extends AccountIdentifiable, NoSQLDocument, NewEventObject {
		/**
		 * ID of the Event, can be expressed as the event number
		 */
		id: number;
	}

	export interface NewEventObject {
		timeModified: number;
		timeCreated: number;
		name: string;
		meetDateTime: number;
		meetLocation: string;
		startDateTime: number;
		location: string;
		endDateTime: number;
		pickupDateTime: number;
		pickupLocation: string;
		transportationProvided: boolean;
		transportationDescription: string;
		uniform: MultCheckboxReturn;
		desiredNumberOfParticipants: number;
		registration?: {
			deadline: number;
			information: string;
		};
		participationFee?: {
			feeDue: number;
			feeAmount: number;
		};
		mealsDescription: MultCheckboxReturn;
		lodgingArrangments: MultCheckboxReturn;
		activity: MultCheckboxReturn;
		highAdventureDescription: string;
		requiredEquipment: string[];
		eventWebsite: string;
		requiredForms: MultCheckboxReturn;
		comments: string;
		acceptSignups: boolean;
		signUpDenyMessage: string;
		publishToWingCalendar: boolean;
		showUpcoming: boolean;
		groupEventNumber: number;
		wingEventNumber: number;
		complete: boolean;
		administrationComments: string;
		status: EventStatus;
		debrief: string;
		pointsOfContact: (InternalPointOfContact | ExternalPointOfContact)[];
		author: number;
		signUpPartTime: boolean;
		teamID: number;
		sourceEvent?: {
			id: number;
			accountID: string;
		};
	}

	export interface AttendanceRecord {
		timestamp: number;
		eventID: number;
		accountID: string;
		memberID: number;
		memberRankName: string;
		comments: string;
		status: AttendanceStatus;
		requirements: string;
		summaryEmailSent: boolean;
		planToUseCAPTransportation: boolean;
	}
	
	export const enum AttendanceStatus {
		COMMITTEDATTENDED,
		NOSHOW,
		RESCINDEDCOMMITMENTTOATTEND
	}
}
