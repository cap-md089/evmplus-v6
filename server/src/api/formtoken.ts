import * as express from 'express';
import * as uuid from 'uuid/v4';
import MemberBase, { ProspectiveMember } from '../lib/Members';
import NHQMember, { MemberRequest } from '../lib/members/NHQMember';

let validTokens: Array<{
	member: ProspectiveMember | NHQMember;
	token: string;
	expire: number;
}> = [];

const TOKEN_EXPIRE_TIME = 20000;

export const getFormToken: express.RequestHandler = (req: MemberRequest, res) => {
	const token = uuid();
	validTokens.push({
		member: req.member,
		token,
		expire: Date.now() + TOKEN_EXPIRE_TIME
	});
	res.json({
		token
	});
};

export const validRawToken = (token: string, member: MemberBase): boolean => {
	pruneTokens();
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

export const validRawTokenAlone = (token: string): ProspectiveMember | NHQMember | null => {
	pruneTokens();
	const results = validTokens.filter(tokens => tokens.token === token);
	if (results.length === 1) {
		const member = results[0].member;
		validTokens = validTokens.filter(tokens => tokens.token !== token);
		return member;
	} else {
		return null;
	}
};

export const validToken = (req: MemberRequest): boolean => {
	if (validRawToken(req.body.token, req.member)) {
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

const pruneTokens = () => {
	validTokens = validTokens.filter(token => token.expire > Date.now());
};
