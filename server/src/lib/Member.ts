import * as CAP from '../types';
import Account from './Account';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export default class Member extends CAP.MemberObject {
	private static secret: string = 'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e'; 

	public static memberSessions: {
		capid: number;
		expireTime: number;
		contact: CAP.MemberContact;
		memberName: string;
		memberNameLast: string;
		memberRankname: string;
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
		canPerformNHQActions: boolean;
	}[] = [];

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

	public static Estimate (capid: number, global: boolean = false, account?: Account): Promise<Member> {
		// let mem: Member;

		// mem.canPerformNHQActions = false;
		return null;
	}
	
	public static ExpressMiddleware (req: Request & {member: Member | null}, res: Response, next: NextFunction): void {
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
		super(); // Doesn't do anything, CAP.MemberObject has no constructor
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
	
	public setSessionID (): string {
		Member.memberSessions.push({
			capid: this.id,
			expireTime: (Date.now() / 1000) * (60 * 10),
			contact: this.contact,
			cookieData: this.cookieData,
			memberName: this.memberName,
			memberRank: this.memberRank,
			memberNameLast: this.memberNameLast,
			memberRankname: this.memberRankName,
			rawContact: this.rawContact,
			squadMember: this.squadMember,
			accessLevel: this.accessLevel,
			squadron: this.squadron,
			nameFirst: this.nameFirst,
			nameMiddle: this.nameMiddle,
			nameLast: this.nameLast,
			nameSuffix: this.nameSuffix,
			canPerformNHQActions: this.canPerformNHQActions
		});
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