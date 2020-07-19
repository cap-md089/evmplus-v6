import { always, CAPMember, Either, Member, MemberCreateError, SigninReturn } from 'common-lib';
import fetchApi from './apis';

export const isCAPMember = (m?: Member): m is CAPMember =>
	m?.type === 'CAPNHQMember' || m?.type === 'CAPProspectiveMember';

/**
 * Given a session ID, queries the server for the member that the session ID belongs to
 *
 * @param sessionID The session ID for the member to get
 */
export function getMember(sessionID: string): Promise<SigninReturn> {
	return fetchApi
		.check({}, {}, sessionID)
		.leftFlatMap(always(Either.right({ error: MemberCreateError.UNKOWN_SERVER_ERROR })))
		.fullJoin();
}
