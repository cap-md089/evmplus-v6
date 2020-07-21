/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	ActiveSession,
	always,
	areMembersTheSame,
	AsyncEither,
	asyncLeft,
	asyncRight,
	destroy,
	Either,
	EitherObj,
	errorGenerator,
	get,
	isRioux,
	Maybe,
	MaybeObj,
	MemberCreateError,
	MemberReference,
	ParamType,
	ServerError,
	SessionID,
	SessionType,
	stripProp,
	User,
	UserAccountInformation,
	UserForReference,
	UserObject,
	UserSession,
} from 'common-lib';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { BasicAccountRequest } from '../../Account';
import { resolveReference } from '../../Members';
import { collectResults, findAndBind, safeBind } from '../../MySQLUtil';
import { ServerEither } from '../../servertypes';
import { getPermissionsForMemberInAccountDefault } from './Account';

const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGE = 10 * 60 * 1000 * (process.env.NODE_ENV === 'development' ? 100 : 1);
const SESSION_ID_BYTE_COUNT = 64;
const SESSION_TABLE = 'Sessions';

const MEMBER_CREATE_ERRORS = {
	[MemberCreateError.DATABASE_ERROR]: 'Unknown server error',
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'Incorrect credentials provided',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session ID',
	[MemberCreateError.NONE]: '',
	[MemberCreateError.PASSWORD_EXPIRED]: 'Password expired',
	[MemberCreateError.RECAPTCHA_INVALID]: 'Invalid reCAPTCHA provided',
	[MemberCreateError.SERVER_ERROR]: 'Unknown server error',
	[MemberCreateError.UNKOWN_SERVER_ERROR]: 'Unknown server error',
};

export interface BasicMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: User;

	session: ActiveSession;
}

export interface BasicMaybeMemberRequest<P extends ParamType = {}, B = any>
	extends BasicAccountRequest<P, B> {
	member: MaybeObj<User>;

	session: MaybeObj<ActiveSession>;
}

const addSessionToDatabase = (
	schema: Schema,
	session: UserSession
): AsyncEither<ServerError, UserSession> =>
	asyncRight<ServerError, Schema>(schema, errorGenerator('Could not create session for user'))
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection => collection.add(session).execute())
		.map(always(session));

const removeOldSessions = (schema: Schema): AsyncEither<MemberCreateError, void> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection =>
			safeBind(collection.remove('created < :created'), {
				created: Date.now() - SESSION_AGE,
			}).execute()
		)
		.map(destroy);

const updateSessionExpireTime = (
	schema: Schema,
	session: UserSession
): AsyncEither<MemberCreateError, UserSession> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection =>
			safeBind(collection.modify('sessionID = :sessionID'), {
				sessionID: session.id,
			})
				.set('created', Date.now())
				.execute()
		)
		.map(
			always({
				...session,
				created: Date.now(),
			})
		);

const getSessionFromID = (
	schema: Schema,
	sessionID: SessionID
): AsyncEither<MemberCreateError, UserSession> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection => collectResults(findAndBind(collection, { id: sessionID })))
		.filter(sessions => sessions.length === 1, MemberCreateError.INVALID_SESSION_ID)
		.map(get(0))
		.map(stripProp('_id'));

export const createSessionForUser = (
	schema: Schema,
	userAccount: UserAccountInformation
): AsyncEither<ServerError, UserSession> =>
	asyncRight<ServerError, Buffer>(
		promisedRandomBytes(SESSION_ID_BYTE_COUNT),
		errorGenerator('Could not create session for user')
	)
		.map<string>(bytes => bytes.toString('hex'))
		.map<UserSession>(sessionID => ({
			id: sessionID,
			created: Date.now(),
			userAccount,
			type: SessionType.REGULAR,
		}))
		.flatMap(session => addSessionToDatabase(schema, session));

export const setSessionType = (
	schema: Schema,
	session: UserSession,
	type: SessionType
): AsyncEither<ServerError, UserSession> =>
	asyncRight<ServerError, UserSession>(session, errorGenerator('Could not update user session'))
		.map<UserSession>(sess => ({
			...sess,
			type,
		}))
		.tap(sess =>
			safeBind(
				schema.getCollection<UserSession>(SESSION_TABLE).modify('sessionID = :sessionID'),
				{
					sessionID: sess.id,
				}
			)
				.set('type', type)
				.execute()
		);

export const restoreFromSession = (schema: Schema) => (account: AccountObject) => <
	T extends MemberReference = MemberReference
>(
	session: UserSession<T>
) =>
	AsyncEither.All([
		asyncRight(
			getPermissionsForMemberInAccountDefault(schema, session.userAccount.member, account),
			errorGenerator('Could not get permissions for member')
		),
		resolveReference(schema)(account)(session.userAccount.member),
	])
		.map<UserForReference<T>>(([permissions, member]) => ({
			...member,
			...({
				permissions,
				sessionID: session.id,
			} as UserObject),
		}))
		.map<ActiveSession<T>>(user => ({
			created: session.created,
			id: session.id,
			type: session.type,
			user,
			userAccount: session.userAccount,
		}));

export const sessionLength = (session: UserSession) => Date.now() - session.created;

export const validateSession = (
	schema: Schema,
	sessionID: SessionID
): AsyncEither<MemberCreateError, UserSession> =>
	removeOldSessions(schema)
		.flatMap(() => getSessionFromID(schema, sessionID))
		.flatMap(session => updateSessionExpireTime(schema, session));

export function memberRequestTransformer(
	sessionType: SessionType,
	memberRequired: false
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	ServerError,
	BasicMaybeMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;
export function memberRequestTransformer(
	sessionType: SessionType,
	memberRequired: true
): <T extends BasicAccountRequest>(
	req: T
) => AsyncEither<
	ServerError,
	BasicMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;

export function memberRequestTransformer(
	sessionType: SessionType,
	memberRequired: boolean = false
) {
	return <T extends BasicAccountRequest>(
		req: T
	): AsyncEither<ServerError, BasicMaybeMemberRequest | BasicMemberRequest> =>
		new AsyncEither(
			(typeof req.headers !== 'undefined' && typeof req.headers.authorization !== 'undefined'
				? asyncRight(req, errorGenerator('Could not get information for session'))
				: asyncLeft<ServerError, T>({
						type: 'OTHER',
						code: 400,
						message: 'Authorization header not provided',
				  })
			)
				.flatMap<UserSession>(() =>
					validateSession(req.mysqlx, req.headers.authorization!).leftMap(
						code => ({
							type: 'OTHER',
							code: 400,
							message: MEMBER_CREATE_ERRORS[code],
						}),
						errorGenerator('Could not validate sesion')
					)
				)
				// tslint:disable-next-line:no-bitwise
				.filter(session => (sessionType & session.type) !== 0, {
					type: 'OTHER',
					code: 400,
					message: 'Invalid session type',
				})
				.flatMap<ActiveSession>(restoreFromSession(req.mysqlx)(req.account))
				.cata<EitherObj<ServerError, T & BasicMaybeMemberRequest>>(
					err => {
						return err.code === 500 || memberRequired
							? Either.left<ServerError, T & BasicMaybeMemberRequest>(err)
							: Either.right<ServerError, T & BasicMaybeMemberRequest>({
									...req,
									member: Maybe.none(),
									session: Maybe.none(),
							  });
					},
					session =>
						Either.right<ServerError, T & BasicMaybeMemberRequest>({
							...req,
							// Kind of hard to make the types match what is above
							// Basically the function declaration is enforced, but not easily
							// This is the only not easy bit
							member: memberRequired ? session.user : Maybe.some(session.user),
							session: memberRequired ? session : Maybe.some(session),
						} as T & BasicMaybeMemberRequest)
				),
			errorGenerator('Could not get user information')
		);
}

export const su = async (schema: Schema, session: UserSession, newUser: MemberReference) => {
	if (!isRioux(session.userAccount.member.id)) {
		throw new Error('Cannot use su if not Rioux');
	}

	const sessions = schema.getCollection<UserSession>(SESSION_TABLE);

	const userAccount = session.userAccount;
	userAccount.member = newUser;

	await safeBind(sessions.modify('id = :sessionID'), { sessionID: session.id })
		.set('userAccount', userAccount)
		.execute();
};

export const addSessionTypes = (...sessionTypes: SessionType[]) =>
	// tslint:disable-next-line:no-bitwise
	sessionTypes.reduce((prev, curr) => prev | curr, 0);

export const filterSession = (sessionType: SessionType) => (request: BasicMemberRequest) =>
	// tslint:disable-next-line:no-bitwise
	(request.session.type & sessionType) !== 0;

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
			created: Date.now(),
		})
		.execute();
};

const removeOldTokens = async (schema: Schema) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	await safeBind(tokenCollection.remove('created < :created'), {
		created: Date.now() - TOKEN_AGE,
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

		return areMembersTheSame(member.member)(user);
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

export const RequireSessionType = (
	sessionType: SessionType,
	message = 'Member cannot perform the requested action with their current session. Try signing out and back in'
) => <R extends { session?: MaybeObj<ActiveSession> | ActiveSession }, V>(
	f: (req: R) => ServerEither<V>
) => (req: R) =>
	('session' in req && !!req.session
		? 'hasValue' in req.session
			? req.session.hasValue
				? // tslint:disable-next-line:no-bitwise
				  (sessionType & req.session.value.type) !== 0
					? asyncRight<ServerError, R>(req, errorGenerator('Could not process request'))
					: asyncLeft<ServerError, R>({
							type: 'OTHER',
							code: 403,
							message,
					  })
				: asyncLeft<ServerError, R>({
						type: 'OTHER',
						code: 403,
						message,
				  })
			: // tslint:disable-next-line:no-bitwise
			(sessionType & req.session.type) !== 0
			? asyncRight<ServerError, R>(req, errorGenerator('Could not process request'))
			: asyncLeft<ServerError, R>({
					type: 'OTHER',
					code: 403,
					message,
			  })
		: asyncLeft<ServerError, R>({
				type: 'OTHER',
				code: 403,
				message,
		  })
	).flatMap(f);

//#endregion
