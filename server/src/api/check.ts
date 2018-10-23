import * as express from 'express';
import { MemberCreateError } from '../enums';
import { ConditionalMemberRequest } from '../lib/MemberBase';
import NHQMember from '../lib/members/NHQMember';
import ProspectiveMember from '../lib/members/ProspectiveMember';
import { json } from '../lib/Util';

export default (req: ConditionalMemberRequest, res: express.Response) => {
	if (!!req.member) {
		if (req.member.kind === 'ProspectiveMember') {
			json<SigninReturn>(res, {
				error: MemberCreateError.NONE,
				valid: true,
				sessionID: req.member.sessionID,
				member: {
					kind: 'ProspectiveMember',
					object: (req.member as ProspectiveMember).toRaw()
				}
			});
		} else {
			json<SigninReturn>(res, {
				error: MemberCreateError.NONE,
				valid: true,
				sessionID: req.member.sessionID,
				member: {
					kind: 'NHQMember',
					object: (req.member as NHQMember).toRaw()
				}
			});
		}
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID,
			valid: false,
			sessionID: '',
			member: null
		});
	}
};
