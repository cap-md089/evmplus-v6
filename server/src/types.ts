export interface Identifiable {
	id: string | number;
}

export class EventObject {

}

export enum MemberCreateError {
	INVALID_CREDENTIALS,
	PASSWORD_EXPIRED
}

export enum MemberCAPWATCHErrors {
	INVALID_PERMISSIONS,
	NO_NHQ_ACTION
}

export interface MemberContactInstance {
	PRIMARY: string[];
	SECONDARY: string[];
	EMERGENCY: string[];
}

export type MemberAccessLevel = 'Member' | 'CadetStaff' | 'Manager' | 'Admin';

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
	 * Check for this from the Member.Create function, it shows whether it is valid
	 */
	valid: boolean;
	/**
	 * The error to use when the valid boolean is false
	 */
	error?: MemberCreateError;
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
	 * The raw contact information
	 * 
	 * @deprecated
	 */
	rawContact: string;
	/**
	 * Cookies from NHQ to be stored and used to gather information
	 */
	cookieData: string;
	/**
	 * Duty positions listed on CAP NHQ, along with temporary ones assigned here
	 */
	dutyPositions: string[];
	/**
	 * Permissions of the user
	 */
	permissions: {
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
	};
	/**
	 * Is the member a member of the squadron of the page they are currrently viewing?
	 */
	squadMember: boolean;
	/**
	 * The permission descriptor for the access level
	 */
	accessLevel: MemberAccessLevel;
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
	 * Whether or not the user can perform actions on CAP NHQ
	 * 
	 * Since member objects created by Estimate don't have cookies, this is for that
	 */
	canPerformNHQActions: boolean;
}

export interface AccountObject {
	/**
	 * The Account ID
	 */
	id: string;
	/**
	 * The SQL used to select all organizations that are in the account
	 */
	orgSQL: string;
	/**
	 * The ids of the organizations
	 */
	orgIDs: number[];
	/**
	 * Whether the account is a paid account
	 */
	paid: boolean;
	/**
	 * Whether the accoutn is a valid paid account
	 */
	validPaid: boolean;
	/**
	 * Whether the account is expired
	 */
	expired: boolean;
	/**
	 * When the account expires in (seconds)
	 */
	expiresIn: number;
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

export interface FileObject extends Identifiable {
	/**
	 * The file identifier
	 */
	id: string;
	/**
	 * The file name
	 */
	name: string;
	/**
	 * The MIME type for the file
	 */
	contentType: string;
	/**
	 * Raw data for the file
	 * 
	 * Not sent with requests
	 */
	content?: Buffer;
	/**
	 * Comments for the file
	 */
	comments: string;
	/**
	 * Is it a photo? Basically if content type starts with image/
	 */
	isPhoto: boolean;
	/**
	 * The size of the buffer, as it is not always present
	 */
	size: number;
}

import { RawDraftContentState } from '../client/node_modules/@types/draft-js';

export interface BlogPost {
	id: number;
	title: string;
	authorid: number;
	content: RawDraftContentState;
	fileIDs: string[];
	posted: number;
}