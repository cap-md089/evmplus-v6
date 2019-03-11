import { MemberReference } from 'common-lib';
import * as express from 'express';
import * as uuid from 'uuid/v4';
import MemberBase from '../lib/Members';
import { MemberRequest } from '../lib/members/NHQMember';
import { asyncErrorHandler } from '../lib/Util';

let validTokens: Array<{
	member: MemberReference;
	token: string;
}> = [];

export const getFormToken: express.RequestHandler = (req: MemberRequest, res) => {
	const token = uuid();
	validTokens.push({
		member: req.member.getReference(),
		token
	});
	res.json({
		token
	});
};

export const validRawToken = (token: string, member: MemberBase): boolean => {
	if (
		validTokens.filter(
			tokens => member.matchesReference(tokens.member) && token === tokens.token
		).length === 1
	) {
		validTokens = validTokens.filter(
			tokens => !(member.matchesReference(tokens.member) && token === tokens.token)
		);
		return true;
	} else {
		return false;
	}
};

export const validToken = (req: MemberRequest): boolean => {
	if (validRawToken(req.body.token, req.member)) {
		return true;
	} else {
		return false;
	}
};

export const tokenMiddleware = asyncErrorHandler((
	req: MemberRequest,
	res,
	next
) => {
	if (validToken(req)) {
		next();
	} else {
		res.status(403);
		res.end();
	}
});