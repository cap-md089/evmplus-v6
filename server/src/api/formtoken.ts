import * as express from 'express';
import { getMemberForWeakToken, getTokenForUser, isTokenValid } from '../lib/member/pam/Session';
import { MemberRequest } from '../lib/Members';
import { asyncErrorHandler } from '../lib/Util';

export const getFormToken: express.RequestHandler = async (req: MemberRequest, res) => {
	const token = await getTokenForUser(req.mysqlx, req.member.userAccount);

	res.json({
		token
	});
};

export const validRawToken = isTokenValid;

export const validRawTokenAlone = getMemberForWeakToken;

export const validToken = async (req: MemberRequest): Promise<boolean> => {
	if (validRawToken(req.mysqlx, req.member, req.body.token)) {
		return true;
	} else {
		return false;
	}
};

export const tokenMiddleware = asyncErrorHandler(
	async (req: MemberRequest, res: express.Response, next: express.NextFunction) => {
		if (await validToken(req)) {
			next();
		} else {
			res.status(403);
			res.end();
		}
	}
);
