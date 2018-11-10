import MemberBase from './MemberBase';
import Account from './Account';

import CAPMember from './members/CAPMember';
import CAPProspectiveMember from './members/CAPProspectiveMember';
import myFetch from './myFetch';
import { MemberCreateError } from '../enums';

export { CAPProspectiveMember, CAPMember };

export const createCorrectMemberObject = (
	mem: Member,
	acc: Account,
	sid: string
): MemberClasses | null =>
	mem.type === 'CAPNHQMember'
		? new CAPMember(mem, acc, sid)
		: mem.type === 'CAPProspectiveMember'
			? new CAPProspectiveMember(mem, acc, sid)
			: null;

export type MemberClasses = CAPMember | CAPProspectiveMember;

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

	return json;
}

export default MemberBase;