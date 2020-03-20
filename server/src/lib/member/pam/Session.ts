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
	leftyAsyncErrorHandler,
	MemberBase,
	ParamType,
	safeBind,
	serverErrorGenerator
} from '../../internals';

const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGE = 10 * 60 * 1000 * 100;
const SESSION_ID_BYTE_COUNT = 64;
const SESSION_TABLE = 'Sessions';

export enum SessionType {
	REGULAR = 1,
	PASSWORD_RESET = 2,
	SCAN_ADD = 4
}

export interface Session {
	id: SessionID;
	created: number;
	userAccount: UserAccountInformation;
	type: SessionType;
}

export type UserList = CAPNHQUser | CAPProspectiveUser;

export interface ConditionalMemberRequest<P extends ParamType = {}, B = any>
	extends AccountRequest<P, B> {
	member: UserList | null;
}

export interface MemberRequest<P extends ParamType = {}, B = any> extends AccountRequest<P, B> {
	member: UserList;
}

export interface BasicConditionalMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: UserList | null;
}

export interface BasicMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: UserList;
}

export interface MaybeMemberRequest<P extends ParamType = {}, B = any>
	extends AccountRequest<P, B> {
	member: Maybe<UserList>;
}

export interface BasicMaybeMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: Maybe<UserList>;
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
			safeBind(collection.remove('created < :created'), {
				created: Date.now() - SESSION_AGE
			}).execute()
		)
		.map(() => void 0);

const updateSessionExpireTime = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection =>
			safeBind(collection.modify('sessionID = :sessionID'), {
				sessionID: session.id
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
		.map(collection => collectResults(findAndBind(collection, { id: sessionID })));

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
			id: sessionID,
			created: Date.now(),
			userAccount,
			type: SessionType.REGULAR
		}))
		.flatMap(session => addSessionToDatabase(schema, session));

export const setSessionType = (
	schema: Schema,
	session: Session,
	type: SessionType
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Session>(session, MemberCreateError.SERVER_ERROR)
		.map<Session>(sess => ({
			...sess,
			type
		}))
		.tap(sess =>
			safeBind(
				schema.getCollection<Session>(SESSION_TABLE).modify('sessionID = :sessionID'),
				{
					sessionID: sess.id
				}
			)
				.set('type', type)
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
			return this.sessionInformation.id;
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

			await su(this.schema, this.sessionInformation, ref);
		}
	}

	return User;
};

export function memberRequestTransformer(
	sessionType: SessionType,
	memberRequired: false
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	api.ServerError,
	BasicMaybeMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;
export function memberRequestTransformer(
	sessionType: SessionType,
	memberRequired: true
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	api.ServerError,
	BasicMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;

export function memberRequestTransformer(
	sessionType: SessionType,
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
					// tslint:disable-next-line: no-bitwise
					(sessionType & session.type) !== session.type
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
	sessionType: SessionType
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

			// tslint:disable-next-line: no-bitwise
			if ((sessionType & session.type) !== session.type) {
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
	SessionType.REGULAR
);
export const conditionalMemberMiddlewareWithPasswordOnly = conditionalMemberMiddlewareGenerator(
	asyncErrorHandler,
	SessionType.PASSWORD_RESET
);
export const leftyConditionalMemberMiddleware = conditionalMemberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	SessionType.REGULAR
);
export const leftyConditionalMemberMiddlewareWithPasswordOnly = conditionalMemberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	SessionType.PASSWORD_RESET
);

export const memberMiddlewareGenerator = (
	errorHandler: typeof asyncErrorHandler,
	sessionType: SessionType,
	beLefty: boolean
) => (req: ConditionalMemberRequest, res: Response, next: NextFunction) =>
	conditionalMemberMiddlewareGenerator(errorHandler, sessionType)(req, res, () => {
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

export const memberMiddleware = memberMiddlewareGenerator(
	asyncErrorHandler,
	SessionType.REGULAR,
	false
);
export const memberMiddlewareWithPassswordOnly = memberMiddlewareGenerator(
	asyncErrorHandler,
	SessionType.PASSWORD_RESET,
	false
);
export const leftyMemberMiddleware = memberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	SessionType.REGULAR,
	true
);
export const leftyMemberMiddlewareWithPassswordOnly = memberMiddlewareGenerator(
	leftyAsyncErrorHandler,
	SessionType.PASSWORD_RESET,
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

export const su = async (schema: Schema, session: Session, newUser: MemberReference) => {
	const sessions = schema.getCollection<Session>(SESSION_TABLE);

	const userAccount = session.userAccount;
	userAccount.member = newUser;

	await safeBind(sessions.modify('id = :sessionID'), { sessionID: session.id })
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

	await safeBind(tokenCollection.remove('created < :created'), {
		created: Date.now() - TOKEN_AGE
	}).execute();
};

const getTokenList = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	return await collectResults(findAndBind(tokenCollection, { token }));
};

const invalidateToken = async (schema: Schema, token: string) => {
	const collection = schema.getCollection<TokenObject>('Tokens');

	await safeBind(collection.remove('token = :token'), { token }).execute();
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
