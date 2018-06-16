import Member from '../BaseMember';
import { MemberContact, MemberAccessLevel, MemberPermissions, MemberObject } from '../../types';
import { getCookies } from './pam/nhq-authenticate';
import { Response, NextFunction } from 'express';

interface MemberSession {
	id: number;
	expireTime: number;

	contact: MemberContact;
	memberRank: string;
	cookieData: string;
	accessLevel: MemberAccessLevel;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
}

export enum MemberCreateError {
	INCORRECT_CREDENTIALS,
	PASSWORD_EXPIRED
}

export interface MemberRequest {
	member?: NHQMember;
}

export default class NHQMember extends Member {
	/**
	 * Used to sign JWTs
	 */
	private static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	/**
	 * Stores the member sessions in memory as it is faster than a database
	 */
	protected static memberSessions: MemberSession[] = [];

	/**
	 * Permissions for the user
	 */
	public permissions: MemberPermissions = {
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
	 * The access level which determines the permissions
	 */
	public accessLevel: MemberAccessLevel = 'Member';
	/**
	 * The cookie data used to access NHQ
	 */
	private cookie: string = '';

	public static async Create (username: string, password: string): Promise<{
		member?: NHQMember,
		error?: MemberCreateError
	}> {
		let cookies = await getCookies(username, password);

		return {};
	}

	public static async ExpressMiddleware (
		req: MemberRequest,
		res: Response,
		next: NextFunction
	) {
		//
	}

	private constructor (
		data: MemberObject,
		permissions: MemberPermissions,
		accessLevel: MemberAccessLevel,
		cookie: string
	) {
		super(data);
		this.permissions = permissions;
		this.accessLevel = accessLevel;
		this.cookie = cookie;
	}
}