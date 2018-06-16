import * as CAP from '../types.d';
import Account from './Account';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import 'es6-promise';

import { MySQLRequest } from './MySQLUtil';

export interface MemberRequest extends MySQLRequest {
	member?: Member;
}

interface MemberSession {
	id: number;
	expireTime: number;
	contact: CAP.MemberContact;
	memberRank: string;
	rawContact: string;
	cookieData: string;
	squadMember: boolean;
	accessLevel: CAP.MemberAccessLevel;
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
	static memberSessions: MemberSession[] = [];

	/**
	 * The CAPID of the member
	 */
	id: number = 0;
	/**
	 * Check for this from the Member.Create function, it shows whether it is valid
	 */
	valid: boolean = false;
	/**
	 * The rank of the member provided
	 */
	memberRank: string = '';
	/**
	 * Whether or not the member is a senior member
	 */
	seniorMember: boolean = false;
	/**
	 * memberName + memberRank
	 */
	memberRankName: string = '';
	/**
	 * Contact information for the user
	 */
	contact: CAP.MemberContact = {
		ALPHAPAGER : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		ASSISTANT : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		CADETPARENTEMAIL : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		CADETPARENTPHONE : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		CELLPHONE : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		DIGITALPAGER : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		EMAIL : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		HOMEFAX : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		HOMEPHONE : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		INSTANTMESSAGER : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		ISDN : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		RADIO : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		TELEX : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		WORKFAX : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		},
		WORKPHONE : {
			PRIMARY: [],
			SECONDARY: [],
			EMERGENCY: []
		}
	};
	/**
	 * The raw contact information
	 * 
	 * @deprecated
	 */
	rawContact: string = '';
	/**
	 * Cookies from NHQ to be stored and used to gather information
	 */
	cookieData: string = '';
	/**
	 * Duty positions listed on CAP NHQ, along with temporary ones assigned here
	 */
	dutyPositions: string[] = [];
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
		 * Whether or not the user can edit an event
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
	} = {
		FlightAssign: 0,
		MusterSheet: 0,
		PTSheet: 0,
		PromotionManagement: 0,
		AssignTasks: 0,
		AdministerPT: 0,
		DownloadStaffGuide: 0,
		AddEvent: 0,
		EditEvent: 0,
		EventContactSheet: 0,
		SignUpEdit: 0,
		CopyEvent: 0,
		ORMOPORD: 0,
		DeleteEvent: 0,
		AssignPosition: 0,
		EventStatusPage: 0,
		ProspectiveMemberManagment: 0,
		EventLinkList: 0,
		AddTeam: 0,
		EditTeam: 0,
		FileManagement: 0,
		PermissionManagement: 0,
		DownloadCAPWATCH: 0,
		RegistryEdit: 0
	};
	/**
	 * Is the member a member of the squadron of the page they are currrently viewing?
	 */
	squadMember: boolean = false;
	/**
	 * The permission descriptor for the access level
	 */
	accessLevel: CAP.MemberAccessLevel = 'Member';
	/**
	 * The Squadron a member belongs to
	 */
	squadron: string = '';
	/**
	 * First name of member
	 */
	nameFirst: string = '';
	/**
	 * Middle name of member
	 */
	nameMiddle: string = '';
	/**
	 * Last name of member
	 */
	nameLast: string = '';
	/**
	 * Suffix of member
	 */
	nameSuffix: string = '';
	/**
	 * Whether or not the user can perform actions on CAP NHQ
	 * 
	 * Since member objects created by Estimate don't have cookies, this is for that
	 */
	canPerformNHQActions: boolean = false;
	
	public static Create (uname: number, pass: string): Promise<Member> {
		// tslint:disable-next-line:no-any
		return new (Promise as any)((res: (mem: Member) => void, rej: () => void) => {
			let mem = new this({
				id: uname,
				memberRank: '',
				seniorMember: false,
				contact: {
					ALPHAPAGER : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					ASSISTANT : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					CADETPARENTEMAIL : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					CADETPARENTPHONE : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					CELLPHONE : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					DIGITALPAGER : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					EMAIL : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					HOMEFAX : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					HOMEPHONE : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					INSTANTMESSAGER : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					ISDN : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					RADIO : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					TELEX : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					WORKFAX : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					},
					WORKPHONE : {
						PRIMARY: [],
						SECONDARY: [],
						EMERGENCY: []
					}
				},
				dutyPositions: [],
				squadron: '',
				nameFirst: '',
				nameLast: '',
				nameMiddle: '',
				nameSuffix: '',
			});

			res(mem);
		});
	}

	public static Check (capid: number): Promise<Member> | null {
		return new Promise ((res: (mem: Member) => void, rej: () => void) => {
			let session = Member.memberSessions.filter(sess => sess.id === capid);
			if (session.length === 1) {
				let {
					id,
					contact,
					memberRank,
					squadron,
					nameFirst,
					nameMiddle,
					nameLast,
					nameSuffix
				} = session[0];
				res(new this({
					id,
					contact,
					memberRank,
					squadron,
					nameFirst,
					nameMiddle,
					nameLast,
					nameSuffix,
					seniorMember: false,
					dutyPositions: [],
				}));
			} else {
				rej();
			}
		});
	}

	public static Estimate (
		capid: number,
		global: boolean = false,
		account?: Account
	): Promise<Member> | null {
		// let mem: Member;

		// mem.canPerformNHQActions = false;
		return null;
	}
	
	public static ExpressMiddleware (
		req: Request & {member: Member | null},
		res: Response,
		next: NextFunction
	): void {
		if (typeof req.headers !== 'undefined' && typeof req.headers.authorization !== 'undefined') {
			let header = req.headers.authorization;
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
						req.member = null;
						next();
						return;
					}
					Member
						.Check(decoded.capid)
						.then((mem: Member | null) => {
							if (mem !== null) {
								req.member = mem;
							} else {
								req.member = null;
							}
							next();
						}).catch (() => {
							req.member = null;
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
		// tslint:disable-next-line:no-any
		(<any> Object).assign(this, data);
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
		return false;
	}
	
	public setSession (): string {
		let memberIndex: number = -1;
		for (let i in Member.memberSessions) {
			if (Member.memberSessions[i].id === this.id) {
				memberIndex = parseInt(i, 10);
			}
		}
		if (memberIndex === -1) {
			let {
				id,
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
				expireTime: (Date.now() / 1000) + (60 * 10),
				id,
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
			Member.memberSessions[memberIndex].expireTime = 
				(Date.now() / 1000 + (60 * 10));
		}
		return jwt.sign(
			{
				capid: this.id
			},
			Member.secret,
			{
				algorithm: 'HS512',
				expiresIn: '10min'
			}
		);
	}
}