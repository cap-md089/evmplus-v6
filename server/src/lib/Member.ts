import * as CAP from '../types';
import Account from './Account';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface MemberSession {
	capid: number;
	expireTime: number;
	contact: CAP.MemberContact;
	memberRank: string;
	rawContact: string;
	cookieData: string;
	squadMember: boolean;
	accessLevel: string;
	squadron: string;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
}

export default class Member implements CAP.MemberObject {
	/**
	 * Used to sign the JWTs
	 */
	private static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e'; 

	/**
	 * Store the sessions in memory vs database, as it simplifies code and sessions
	 * 		aren't meant to last very long anyway
	 */
	private static memberSessions: MemberSession[] = [];

	/**
	 * The CAPID of the member
	 */
	capid: number;
	/**
	 * Check for this from the Member.Create function, it shows whether it is valid
	 */
	valid: boolean;
	/**
	 * The error to use when the valid boolean is false
	 */
	error?: CAP.MemberCreateError;
	/**
	 * The name of the member: basically equal to:
	 *      nameFirst + nameMiddle + nameLast + nameSuffix
	 */
	memberName: string;
	/**
	 * Alias of nameLast
	 */
	memberNameLast: string;
	/**
	 * The rank of the member provided
	 */
	memberRank: string;
	/**
	 * Whether or not the member is a senior member
	 */
	seniorMember: boolean;
	/**
	 * memberName + memberRank
	 */
	memberRankName: string;
	/**
	 * Contact information for the user
	 */
	contact: CAP.MemberContact;
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
	accessLevel: string;
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

	public static Create (uname: string, pass: string): Promise<Member> {
		// let mem: Member;

		// mem.canPerformNHQActions = true;
		return null;
	}

	public static Check (capid: number): Promise<Member> {
		// let mem: Member;

		// mem.canPerformNHQActions = true;
		return null;
	}

	public static Estimate (
		capid: number,
		global: boolean = false,
		account?: Account
	): Promise<Member> {
		// let mem: Member;

		// mem.canPerformNHQActions = false;
		return null;
	}
	
	public static ExpressMiddleware (
		req: Request & {member: Member | null},
		res: Response,
		next: NextFunction
	): void {
		if (typeof req.cookies.authorization !== 'undefined') {
			let header = req.cookies.authorization;
			if (typeof header !== 'string') {
				header = header[0];
			}
			jwt.verify(
				header,
				Member.secret,
				{
					algorithms: [
						'HS512'
					]
				},
				(err, decoded: {
					capid: number
				}) => {
					if (err) {
						throw err;
					}
					Member.Check(decoded.capid).then(mem => {
						req.member = mem;
						next();
					});
				}
			);
		} else {
			req.member = null;
			next();
		}
	}

	private constructor (data: CAP.MemberObject) {

	}

	public hasDutyPosition (dutyposition: string | string[]): boolean {
		if (typeof dutyposition === 'string') {
			return this.dutyPositions.indexOf(dutyposition) > -1;
		} else {
			return dutyposition
				.map(this.hasDutyPosition)
				.reduce((a, b) => a || b);
		}
	}

	public hasPermission (permission: string, threshold: number, account?: Account): boolean {
		if (typeof account !== 'undefined') {
			if (typeof this.permissions[permission] !== 'undefined') {
				return this.permissions[permission] > threshold;
			} else {
				return false;
			}
		} else {
			// let perms = this.getAccessLevels(null, account);
			// if (typeof perms[permission] !== 'undefined') {
			//     return perms[permission] > threshold;
			// } else {
			//     return false;
			// }
		}
	}
	
	public setSession (): string {
		let member: number = -1;
		for (let i in Member.memberSessions) {
			if (Member.memberSessions[i].capid === this.capid) {
				member = parseInt(i, 10);
			}
		}
		if (member === -1) {
			let {
				capid,
				contact,
				cookieData,
				memberRank,
				rawContact,
				squadMember,
				accessLevel,
				squadron,
				nameFirst,
				nameMiddle,
				nameLast,
				nameSuffix
			} = this;
			Member.memberSessions.push({
				expireTime: (Date.now() / 1000) * (60 * 10),
				capid,
				contact,
				cookieData,
				memberRank,
				rawContact,
				squadMember,
				accessLevel,
				squadron,
				nameFirst,
				nameMiddle,
				nameLast,
				nameSuffix
			});
		} else {
			Member.memberSessions[member].expireTime = 
				(Date.now() / 1000 * (60 * 10));
		}
		return jwt.sign(
			{
				capid: this.capid
			},
			Member.secret,
			{
				algorithm: 'HS512',
				expiresIn: '10min'
			}
		);
	}
}