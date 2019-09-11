import MemberBase from './MemberBase';
import Account from './Account';

import CAPNHQMember from './members/CAPNHQMember';
import CAPProspectiveMember from './members/CAPProspectiveMember';
import myFetch from './myFetch';
import { MemberCreateError } from 'common-lib/index';
import { Member, SigninReturn } from 'common-lib';

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
): CAPMemberClasses | null =>
	mem.type === 'CAPNHQMember'
		? new CAPNHQMember(mem, acc, sid)
		: mem.type === 'CAPProspectiveMember'
			? new CAPProspectiveMember(mem, acc, sid)
			: null;

export type CAPMemberClasses = CAPNHQMember | CAPProspectiveMember;

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
			valid: false,
			notificationCount: 0,
			taskCount: 0
		};
	}

	const json = await result.json() as SigninReturn;
	localStorage.setItem('sessionID', json.sessionID);

	return json;
}

export default MemberBase;