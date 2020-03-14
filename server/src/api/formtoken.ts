import { api, AsyncEither, asyncLeft, asyncRight, EitherObj, left, none } from 'common-lib';
import * as express from 'express';
import {
	Account,
	asyncEitherHandler2,
	asyncErrorHandler,
	BasicMemberRequest,
	getMemberForWeakToken,
	getTokenForUser,
	isTokenValid,
	leftyAsyncErrorHandler,
	MemberRequest,
	memberRequestTransformer,
	serverErrorGenerator,
	SessionType
} from '../lib/internals';

export const getFormToken = asyncEitherHandler2<EitherObj<api.ServerError, string>>(req =>
	asyncRight(req, serverErrorGenerator('Could not get error'))
		.flatMap(Account.RequestTransformer)
		.flatMap(
			memberRequestTransformer(
				// tslint:disable-next-line: no-bitwise
				SessionType.PASSWORD_RESET | SessionType.REGULAR | SessionType.SCAN_ADD,
				true
			)
		)
		.map(r => getTokenForUser(r.mysqlx, r.member.userAccount))
);

// export const getFormToken: express.RequestHandler = async (req: MemberRequest, res) => {
// 	const token = await getTokenForUser(req.mysqlx, req.member.userAccount);

// 	res.json(right(token));
// };

export const validRawToken = isTokenValid;

export const validRawTokenAlone = getMemberForWeakToken;

export const validToken = async (req: BasicMemberRequest): Promise<boolean> => {
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

export const leftyTokenMiddleware = leftyAsyncErrorHandler(
	async (req: MemberRequest, res, next) => {
		if (await validToken(req)) {
			next();
		} else {
			res.status(403);
			res.json(
				left({
					code: 403,
					error: 'Could not validate token'
				})
			);
		}
	}
);

export function tokenTransformer<T extends BasicMemberRequest>(
	req: T
): AsyncEither<api.ServerError, T> {
	return asyncRight(validToken(req), serverErrorGenerator('Could not validate token')).flatMap(
		valid =>
			valid
				? asyncRight(req, serverErrorGenerator('Could not validate token'))
				: asyncLeft({
						code: 403,
						error: none<Error>(),
						message: 'Could not validate token'
				  })
	);
}
