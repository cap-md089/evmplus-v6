import * as express from 'express';
import * as uuid from 'uuid/v4';
import Member, { MemberRequest } from '../lib/Member';

let validTokens: {
	member: Member,
	token: string
}[] = [];

export const getFormToken: express.RequestHandler = (
	req: MemberRequest,
	res
) => {
	if (req.member) {
		let token = uuid();
		validTokens.push({
			token,
			member: req.member
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
		if (validTokens.filter(tokens =>
			req.member.id === tokens.member.id && req.body.token === tokens.token)
		.length === 1) {
			validTokens = validTokens.filter(tokens =>
				!(req.member.id === tokens.member.id && req.body.token === tokens.token));
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
};