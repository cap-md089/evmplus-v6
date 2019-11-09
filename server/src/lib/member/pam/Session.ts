import { Schema } from '@mysql/xdevapi';
import {
	AsyncEither,
	asyncLeft,
	asyncRight,
	MemberCreateError,
	MemberPermission,
	MemberPermissions,
	MemberReference,
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
	CAPNHQUser,
	CAPProspectiveUser,
	collectResults,
	DEFAULT_PERMISSIONS,
	findAndBind,
	getPermissionsForMemberInAccount,
	MemberBase,
	ParamType
} from '../../internals';

const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGE = 10 * 60 * 1000;
const SESSION_ID_BYTE_COUNT = 64;
const SESSION_TABLE = 'Sessions';

export interface Session {
	sessionID: SessionID;
	created: number;
	userAccount: UserAccountInformation;
}

export interface ConditionalMemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: CAPNHQUser | CAPProspectiveUser | null;
}

export interface MemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: CAPNHQUser | CAPProspectiveUser;
}

const addSessionToDatabase = (
	schema: Schema,
	session: Session
): AsyncEither<MemberCreateError, Session> =>
	asyncRight<MemberCreateError, Schema>(schema, 5)
		.map(s => s.getCollection<Session>(SESSION_TABLE))
		.map(collection => collection.add(session).execute())
		.map(() => session);

const removeOldSessions = (schema: Schema): AsyncEither<MemberCreateError, void> =>
	asyncRight<MemberCreateError, Schema>(schema, 6)
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
	asyncRight<MemberCreateError, Schema>(schema, 7)
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
	asyncRight<MemberCreateError, Schema>(schema, 8)
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
			userAccount
		}))
		.flatMap(session => addSessionToDatabase(schema, session));

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

export type MemberConstructor<T = MemberBase> = new (...args: any[]) => T;

export const SessionedUser = <
	M extends MemberConstructor & {
		Get: (id: any, account: Account, schema: Schema) => Promise<MemberBase>;
	}
>(
	Member: M
) => {
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

export const conditionalMemberMiddleware = asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: Response, next: NextFunction) => {
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
				session = await validateSession(req.mysqlx, header).toSome();
			} catch (e) {
				return next();
			}

			switch (session!.userAccount.member.type) {
				case 'CAPNHQMember':
					req.member = (await CAPNHQUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session!
					)) as CAPNHQUser;
					break;

				case 'CAPProspectiveMember':
					req.member = (await CAPProspectiveUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session!
					)) as CAPProspectiveUser;
					break;
			}

			next();
		} else {
			req.member = null;
			next();
		}
	}
);

export const memberMiddleware = (
	req: ConditionalMemberRequest,
	res: Response,
	next: NextFunction
) =>
	conditionalMemberMiddleware(req, res, () => {
		if (req.member === null) {
			res.status(401);
			res.end();
		} else {
			next();
		}
	});

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

//#region Signin tokens

const SIGNIN_TOKEN_TABLE = 'SigninTokens';

interface SigninTokenObject {
	token: string;
	created: number;
}

const getSigninTokens = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	return collectResults(findAndBind(tokenCollection, { token }));
};

const addSigninTokenToDatabase = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection
		.add({
			token,
			created: Date.now()
		})
		.execute();
};

const removeOldSigninTokens = async (schema: Schema) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection
		.remove('created < :created')
		.bind({ created: Date.now() - TOKEN_AGE })
		.execute();
};

const removeSigninTokens = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection
		.remove('token = :token')
		.bind({ token })
		.execute();
};

export const createSigninToken = async (schema: Schema) => {
	const randomToken = (await randomBytes(48)).toString('hex');

	await addSigninTokenToDatabase(schema, randomToken);

	return randomToken;
};

export const isSigninTokenValid = async (schema: Schema, token: string) => {
	await removeOldSigninTokens(schema);

	const results = await getSigninTokens(schema, token);

	await removeSigninTokens(schema, token);

	return results.length === 1;
};

//#endregion
