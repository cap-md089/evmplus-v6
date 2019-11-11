import { Member, MemberCreateError, SigninReturn } from 'common-lib';
import Account from './Account';
import MemberBase from './MemberBase';
import CAPNHQMember from './members/CAPNHQMember';
import CAPProspectiveMember from './members/CAPProspectiveMember';
import myFetch from './myFetch';
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
			error: MemberCreateError.INVALID_SESSION_ID
		};
	}

	const json = (await result.json()) as SigninReturn;
	if (json.error === MemberCreateError.NONE) {
		localStorage.setItem('sessionID', json.sessionID);
	} else {
		localStorage.removeItem('sessionID');
	}

	return json;
}

export default MemberBase;
