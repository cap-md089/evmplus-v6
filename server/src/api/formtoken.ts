import * as express from 'express';
import * as uuid from 'uuid/v4';
import Member, { MemberRequest } from '../lib/members/NHQMember';

let validTokens: Array<{
	member: Member;
	token: string;
}> = [];

export const getFormToken: express.RequestHandler = (
	req: MemberRequest,
	res
) => {
	if (req.member) {
		const token = uuid();
		validTokens.push({
			member: req.member,
			token
		});
		res.json({
			token
		});
	} else {
		res.status(403);
		res.end();
	}
};

export const validToken = (req: MemberRequest): boolean => {
	if (req.member) {
		if (
			validTokens.filter(
				tokens =>
					req.member.id === tokens.member.id &&
					req.body.token === tokens.token
			).length === 1
		) {
			validTokens = validTokens.filter(
				tokens =>
					!(
						req.member.id === tokens.member.id &&
						req.body.token === tokens.token
					)
			);
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
};
