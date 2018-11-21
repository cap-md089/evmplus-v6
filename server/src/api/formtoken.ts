import * as express from 'express';
import * as uuid from 'uuid/v4';
import MemberBase from '../lib/MemberBase';
import { MemberRequest } from '../lib/members/NHQMember';

let validTokens: Array<{
	member: MemberBase;
	token: string;
}> = [];

export const getFormToken: express.RequestHandler = (
	req: MemberRequest,
	res
) => {
	const token = uuid();
	validTokens.push({
		member: req.member,
		token
	});
	res.json({
		token
	});
};

export const validToken = (req: MemberRequest): boolean => {
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
};

export const tokenMiddleware = (
	req: MemberRequest,
	res: express.Response,
	next: express.NextFunction
) => {
	if (validToken(req)) {
		next();
	} else {
		res.status(403);
		res.end();
	}
};
