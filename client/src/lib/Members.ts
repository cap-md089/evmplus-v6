import MemberBase from './MemberBase';
import Account from './Account';

import CAPNHQMember from './members/CAPNHQMember';
import CAPProspectiveMember from './members/CAPProspectiveMember';
import myFetch from './myFetch';
import { MemberCreateError } from '../enums';

export { CAPProspectiveMember, CAPNHQMember };

/**
 * Creates the correct object to represent the member provided, using the type field
 * on the object itself
 * 
 * @param mem The member to instantiate
 * @param acc The account that is requesting the member
 * @param sid The session ID for the member
 */
export const createCorrectMemberObject = (
	mem: Member,
	acc: Account,
	sid: string
): MemberClasses | null =>
	mem.type === 'CAPNHQMember'
		? new CAPNHQMember(mem, acc, sid)
		: mem.type === 'CAPProspectiveMember'
			? new CAPProspectiveMember(mem, acc, sid)
			: null;

export type MemberClasses = CAPNHQMember | CAPProspectiveMember;

/**
 * Given a session ID, queries the server for the member that the session ID belongs to
 * 
 * @param sessionID The session ID for the member to get
 */
export async function getMember(sessionID: string): Promise<SigninReturn> {
	let result;

	try {
		result = await myFetch('/api/check', {
			headers: {
				authorization: sessionID
			}
		});
	} catch (e) {
		return {
			error: MemberCreateError.INVALID_SESSION_ID,
			member: null,
			sessionID: '',
			valid: false
		};
	}

	const json = await result.json() as SigninReturn;

	json.sessionID = result.headers.get('x-new-sessionid')!;
	if (json.member && json.member.type === 'CAPNHQMember') {
		json.member.sessionID = result.headers.get('x-new-sessionid')!;
	}

	localStorage.setItem('sessionID', json.sessionID);

	return json;
}

export default MemberBase;