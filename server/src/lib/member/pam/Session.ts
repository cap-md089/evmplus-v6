import { Schema } from '@mysql/xdevapi';
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	Either,
	just,
	left,
	Maybe,
	MemberCreateError,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	none,
	right,
	SessionID,
	UserAccountInformation
} from 'common-lib';
import { randomBytes } from 'crypto';
import { NextFunction, Response } from 'express';
import { promisify } from 'util';
import {
	Account,
	AccountRequest,
	areMemberReferencesTheSame,
	asyncErrorHandler,
	BasicAccountRequest,
	CAPNHQUser,
	CAPProspectiveUser,
	collectResults,
	DEFAULT_PERMISSIONS,
	findAndBind,
	getPermissionsForMemberInAccount,
	MemberBase,
	ParamType
} from '../../internals';
import { leftyAsyncErrorHandler, serverErrorGenerator } from '../../Util';

const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGE = 10 * 60 * 1000;
const SESSION_ID_BYTE_COUNT = 64;
const SESSION_TABLE = 'Sessions';

export interface Session {
	sessionID: SessionID;
	created: number;
	userAccount: UserAccountInformation;
	passwordOnly: boolean;
}

export interface ConditionalMemberRequest<P extends ParamType = {}, B = any>
	extends AccountRequest<P, B> {
	member: CAPNHQUser | CAPProspectiveUser | null;
}

export interface MemberRequest<P extends ParamType = {}, B = any> extends AccountRequest<P, B> {
	member: CAPNHQUser | CAPProspectiveUser;
}

export interface BasicConditionalMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: CAPNHQUser | CAPProspectiveUser | null;
}

export interface BasicMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: CAPNHQUser | CAPProspectiveUser;
}

export interface MaybeMemberRequest<P extends ParamType = {}, B = any>
	extends AccountRequest<P, B> {
	member: Maybe<CAPNHQUser | CAPProspectiveUser>;
}

export interface BasicMaybeMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: Maybe<CAPNHQUser | CAPProspectiveUser>;
}

const addSessionToDatabase = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection => collection.add(session).execute())
		.map(() => session);

const removeOldSessions = (schema: Schema): AsyncEither<MemberCreateError, void> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection =>
			collection
				.remove('created < :created')
				.bind({ created: Date.now() - SESSION_AGE })
				.execute()
		)
		.map(() => void 0);

const updateSessionExpireTime = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection =>
			collection
				.modify('sessionID = :sessionID')
				.bind({
					sessionID: session.sessionID
				})
				.set('created', Date.now())
				.execute()
		)
		.map(() => ({
			...session,
			created: Date.now()
		}));

const getSessionFromID = (
	schema: Schema,
	sessionID: SessionID
): AsyncEither<MemberCreateError, Session[]> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection => collectResults(findAndBind(collection, { sessionID })));

export const createSessionForUser = (
	schema: Schema,
	userAccount: UserAccountInformation
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Buffer>(
		promisedRandomBytes(SESSION_ID_BYTE_COUNT),
		MemberCreateError.UNKOWN_SERVER_ERROR
	)
		.map<string>(bytes => bytes.toString('hex'))
		.map<Session>(sessionID => ({
			sessionID,
			created: Date.now(),
			userAccount,
			passwordOnly: false
		}))
		.flatMap(session => addSessionToDatabase(schema, session));

export const unmarkSessionForPasswordReset = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Session>(session, MemberCreateError.SERVER_ERROR)
		.map(sess => ({
			...sess,
			passwordOnly: false
		}))
		.tap(sess =>
			schema
				.getCollection<Session>(SESSION_TABLE)
				.modify('sessionID = :sessionID')
				.bind({
					sessionID: sess.sessionID
				})
				.set('passwordOnly', false)
				.execute()
		);

export const markSessionForPasswordReset = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Session>(session, MemberCreateError.SERVER_ERROR)
		.map(sess => ({
			...sess,
			passwordOnly: true
		}))
		.tap(sess =>
			schema
				.getCollection<Session>(SESSION_TABLE)
				.modify('sessionID = :sessionID')
				.bind({
					sessionID: sess.sessionID
				})
				.set('passwordOnly', true)
				.execute()
		);

export const validateSession = (
	schema: Schema,
	sessionID: SessionID
): AsyncEither<MemberCreateError, Session> =>
	removeOldSessions(schema)
		.flatMap(() => getSessionFromID(schema, sessionID))
		.flatMap(sessions =>
			sessions.length === 1
				? asyncRight(sessions[0], MemberCreateError.UNKOWN_SERVER_ERROR)
				: asyncLeft<MemberCreateError, Session>(MemberCreateError.INVALID_SESSION_ID)
		)
		.flatMap(session => updateSessionExpireTime(schema, session));

export type MemberConstructor<T = MemberBase> = (new (...args: any[]) => T) & MemberGetter<T>;

export interface MemberGetter<T> {
	Get: (id: any, account: Account, schema: Schema) => Promise<T>;
}

export const SessionedUser = <M extends MemberConstructor>(Member: M) => {
	abstract class User extends Member {
		public static async RestoreFromSession(
			schema: Schema,
			account: Account,
			session: Session
		): Promise<User | null> {
			if (session.userAccount.member.type === 'Null') {
				return null;
			}

			let permissions: MemberPermissions;
			try {
				permissions = await getPermissionsForMemberInAccount(
					schema,
					session.userAccount.member,
					account
				);
			} catch (e) {
				permissions = DEFAULT_PERMISSIONS;
			}

			return new User(
				await User.Get(session.userAccount.member.id, account, schema),
				session,
				permissions
			);
		}

		public get sessionID() {
			return this.sessionInformation.sessionID;
		}

		public permissions: MemberPermissions;

		public get username() {
			return this.sessionInformation.userAccount.username;
		}

		public get sessionStarted() {
			return this.sessionInformation.created;
		}

		public get sessionLength() {
			return Date.now() - this.sessionStarted;
		}

		public get userAccount() {
			return this.sessionInformation.userAccount;
		}

		public get session() {
			return { ...this.sessionInformation };
		}

		private sessionInformation: Session;

		public constructor(...params: any[]) {
			const [m, s, p] = params as [User, Session, MemberPermissions];
			super(m, m.schema, m.requestingAccount, m.extraInformation);

			this.sessionInformation = s;
			this.permissions = p;
		}

		public hasPermission<T extends keyof MemberPermissions = MemberPermission>(
			permission: T,
			compare: MemberPermissions[T] = 0 as MemberPermissions[T]
		): boolean {
			return this.isRioux || this.permissions[permission] >= compare;
		}

		public hasSpecificPermissionLevel<T extends keyof MemberPermissions = MemberPermission>(
			permission: T,
			compare: MemberPermissions[T]
		): boolean {
			return this.isRioux || this.permissions[permission] === compare;
		}

		public async su(ref: MemberReference) {
			if (!this.isRioux) {
				throw new Error('Cannot su if not Rioux');
			}

			await su(this.schema, this.sessionID, ref);
		}
	}

	return User;
};

export function memberRequestTransformer(
	allowPasswordOnly: boolean,
	memberRequired: false
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	api.ServerError,
	BasicMaybeMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;
export function memberRequestTransformer(
	allowedPasswordOnly: boolean,
	memberRequired: true
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	api.ServerError,
	BasicMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;

export function memberRequestTransformer(
	allowPasswordOnly: boolean,
	memberRequired: boolean = false
) {
	return <T extends BasicAccountRequest>(
		req: T
	): AsyncEither<api.ServerError, BasicMaybeMemberRequest | BasicMemberRequest> =>
		new AsyncEither(
			(typeof req.headers !== 'undefined' && typeof req.headers.authorization !== 'undefined'
				? asyncRight(req, serverErrorGenerator('Could not get information for session'))
				: asyncLeft({
						code: 400,
						error: none<Error>(),
						message: 'Authorization header not provided'
				  })
			)
				.flatMap<Session>(() =>
					validateSession(req.mysqlx, req.headers.authorization!).leftMap(
						code => ({
							code: 400,
							error: none<Error>(),
							message: code.toString()
						}),
						serverErrorGenerator('Could not validate sesion')
					)
				)
				.flatMap<Session>(session =>
					!allowPasswordOnly && session.passwordOnly
						? asyncLeft({
								code: 400,
								error: none<Error>(),
								message:
									'Member is not allowed to perform actions without finishing the password reset process'
						  })
						: asyncRight(
								session,
								serverErrorGenerator('Could not get information for session')
						  )
				)
				.flatMap<CAPNHQUser | CAPProspectiveUser>(session =>
					session.userAccount.member.type === 'CAPProspectiveMember'
						? asyncRight(
								CAPProspectiveUser.RestoreFromSession(
									req.mysqlx,
									req.account,
									session
								) as Promise<CAPProspectiveUser>,
								serverErrorGenerator('Could not get user information')
						  )
						: session.userAccount.member.type === 'CAPNHQMember'
						? asyncRight(
								CAPNHQUser.RestoreFromSession(
									req.mysqlx,
									req.account,
									session
								) as Promise<CAPNHQUser>,
								serverErrorGenerator('Could not get user information')
						  )
						: asyncLeft({
								code: 400,
								error: none<Error>(),
								message: 'Could not get user information'
						  })
				)
				.cata<Either<api.ServerError, T & BasicMaybeMemberRequest>>(
					err =>
						err.code === 500 || memberRequired
							? left<api.ServerError, T & BasicMaybeMemberRequest>(err)
							: right<api.ServerError, T & BasicMaybeMemberRequest>({
									...req,
									member: none()
							  }),
					user =>
						right<api.ServerError, T & BasicMaybeMemberRequest>({
							...req,
							// Kind of hard to make the types match what is above
							// Basically the function declaration is enforced, but not easily
							// This is the only not easy bit
							member: memberRequired ? user : just(user)
						} as T & BasicMaybeMemberRequest)
				),
			serverErrorGenerator('Could not get user information')
		);
}

const conditionalMemberMiddlewareGenerator = (
	errorHandler: typeof asyncErrorHandler,
	allowPasswordOnly: boolean
) =>
	errorHandler(async (req: ConditionalMemberRequest, res, next) => {
		if (
			typeof req.headers !== 'undefined' &&
			typeof req.headers.authorization !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			let header: string = req.headers.authorization as string;
			if (typeof header !== 'string') {
				header = (header as string[])[0];
			}

			req.member = null;

			let session;
			try {
				const sessionEither = await validateSession(req.mysqlx, header).join();

				if (sessionEither.isRight()) {
					session = sessionEither.value as Session;
				} else {
					return next();
				}
			} catch (e) {
				return next();
			}

			if (!allowPasswordOnly && session.passwordOnly) {
				return next();
			}

			switch (session.userAccount.member.type) {
				case 'CAPNHQMember':
					req.member = (await CAPNHQUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session
					)) as CAPNHQUser;
					break;

				case 'CAPProspectiveMember':
					req.member = (await CAPProspectiveUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session
					)) as CAPProspectiveUser;
					break;
			}

			next();
		} else {
			req.member = null;
			next();
		}
	});

export const conditionalMemberMiddleware = conditionalMemberMiddlewareGenerator(
	asyncErrorHandler,
	false
);
export const conditionalMemberMiddlewareWithPasswordOnly = conditionalMemberMiddlewareGenerator(
	asyncErrorHandler,
	true
);
export const leftyConditionalMemberMiddleware = conditionalMemberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	false
);
export const leftyConditionalMemberMiddlewareWithPasswordOnly = conditionalMemberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	true
);

const memberMiddlewareGenerator = (
	errorHandler: typeof asyncErrorHandler,
	allowPasswordOnly: boolean,
	beLefty: boolean
) => (req: ConditionalMemberRequest, res: Response, next: NextFunction) =>
	conditionalMemberMiddlewareGenerator(errorHandler, allowPasswordOnly)(req, res, () => {
		if (req.member === null) {
			if (beLefty) {
				res.status(401);
				res.json(
					left({
						code: 401,
						error: 'Could not validate session ID'
					})
				);
			} else {
				res.status(401);
				res.end();
			}
		} else {
			next();
		}
	});

export const memberMiddleware = memberMiddlewareGenerator(asyncErrorHandler, false, false);
export const memberMiddlewareWithPassswordOnly = memberMiddlewareGenerator(
	asyncErrorHandler,
	true,
	false
);
export const leftyMemberMiddleware = memberMiddlewareGenerator(leftyAsyncErrorHandler, false, true);
export const leftyMemberMiddlewareWithPassswordOnly = memberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	true,
	true
);

export const permissionMiddleware = (permission: MemberPermission, threshold = 1) => (
	req: MemberRequest,
	res: Response,
	next: NextFunction
) => {
	if (!req.member) {
		res.status(401);
		return res.end();
	}

	if (!req.member.hasPermission(permission, threshold)) {
		res.status(403);
		return res.end();
	}

	next();
};

export const permissionTransformer = <R extends ParamType, B>(
	permission: MemberPermission,
	threshold = 1
) => (req: BasicMemberRequest<R, B>): AsyncEither<api.ServerError, BasicMemberRequest<R, B>> =>
	!req.member.hasPermission(permission, threshold)
		? asyncLeft({
				code: 401,
				error: none<Error>(),
				message: `Member does not have permission '${permission}'`
		  })
		: asyncRight(req, serverErrorGenerator('Could not get member permissions'));

export const leftyPermissionMiddleware = (permission: MemberPermission, threshold = 1) => (
	req: MemberRequest,
	res: Response,
	next: NextFunction
) => {
	if (!req.member) {
		res.status(401);
		return res.json(
			left({
				code: 401,
				error: 'Member required'
			})
		);
	}

	if (!req.member.hasPermission(permission, threshold)) {
		res.status(403);
		return res.json(
			left({
				code: 403,
				error: `Member does not have permission '${permission}'`
			})
		);
	}

	next();
};

export const su = async (schema: Schema, sessionID: SessionID, newUser: MemberReference) => {
	const sessions = schema.getCollection<Session>(SESSION_TABLE);

	// We can assume there is one session, as otherwise they won't be able to get here
	const session = (await collectResults(findAndBind(sessions, { sessionID })))[0];

	const userAccount = session.userAccount;
	userAccount.member = newUser;

	await sessions
		.modify('sessionID = :sessionID')
		.bind({ sessionID })
		.set('userAccount', userAccount)
		.execute();
};

//#endregion

//#region Tokens

const TOKEN_BYTE_COUNT = 64;
const TOKEN_AGE = 20 * 1000;
const TOKEN_TABLE = 'Tokens';

interface TokenObject {
	token: string;
	created: number;
	member: UserAccountInformation;
}

const addTokenToDatabase = async (
	schema: Schema,
	token: string,
	member: UserAccountInformation
) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	await tokenCollection
		.add({
			token,
			member,
			created: Date.now()
		})
		.execute();
};

const removeOldTokens = async (schema: Schema) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	await tokenCollection
		.remove('created < :created')
		.bind({ created: Date.now() - TOKEN_AGE })
		.execute();
};

const getTokenList = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	return await collectResults(findAndBind(tokenCollection, { token }));
};

const invalidateToken = async (schema: Schema, token: string) => {
	const collection = schema.getCollection<TokenObject>('Tokens');

	await collection
		.remove('token = :token')
		.bind({ token })
		.execute();
};

export const getTokenForUser = async (
	schema: Schema,
	user: UserAccountInformation
): Promise<string> => {
	const token = (await randomBytes(TOKEN_BYTE_COUNT)).toString('hex');

	await addTokenToDatabase(schema, token, user);

	return token;
};

export const isTokenValid = async (
	schema: Schema,
	user: MemberReference,
	token: string
): Promise<boolean> => {
	try {
		const member = await getMemberForWeakToken(schema, token);

		if (member === null) {
			return false;
		}

		return areMemberReferencesTheSame(member.member, user);
	} catch (e) {
		return false;
	}
};

export const getMemberForWeakToken = async (
	schema: Schema,
	token: string
): Promise<UserAccountInformation | null> => {
	await removeOldTokens(schema);

	const tokens = await getTokenList(schema, token);

	if (tokens.length !== 1) {
		throw new Error('Cannot find matching token for member');
	}

	const storedTokenObject = tokens[0];
	const storedToken = storedTokenObject.token;

	await invalidateToken(schema, storedToken);

	if (token !== storedToken) {
		throw new Error('Cannot find matching token for member');
	}

	return storedTokenObject.member;
};

export const tokenMiddleware = async (req: MemberRequest, res: Response, next: NextFunction) => {
	res.status(403);
	res.end();
};

//#endregion
