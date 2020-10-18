/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
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
	SafeUserAccountInformation,
	ServerError,
	SessionForSessionType,
	SessionID,
	SessionType,
	StoredMFASecret,
	stripProp,
	toReference,
	User,
	UserAccountInformation,
	UserForReference,
	UserObject,
	UserSession,
} from 'common-lib';
import { randomBytes } from 'crypto';
import type { Totp } from 'speakeasy';
import { promisify } from 'util';
import { BasicAccountRequest } from '../../Account';
import { resolveReference } from '../../Members';
import {
	addToCollection,
	collectResults,
	findAndBind,
	modifyAndBind,
	safeBind,
} from '../../MySQLUtil';
import { ServerEither } from '../../servertypes';
import { getPermissionsForMemberInAccountDefault } from './Account';
import { parse } from 'cookie';

// tslint:disable-next-line: no-var-requires
const speakeasy = require('speakeasy');
speakeasy.generateSecret = speakeasy.generateSecret.bind(speakeasy);
const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGES = {
	[SessionType.REGULAR]: 10 * 60 * 1000 * (process.env.NODE_ENV === 'development' ? 100 : 1),
};

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
	[MemberCreateError.ACCOUNT_USES_MFA]: 'Extra factor required for signin',
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
	session: UserSession,
): AsyncEither<ServerError, UserSession> =>
	asyncRight<ServerError, Schema>(schema, errorGenerator('Could not create session for user'))
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection => collection.add(session).execute())
		.map(always(session));

const removeOldSessions = (schema: Schema): AsyncEither<MemberCreateError, void> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection =>
			safeBind(collection.remove('expires < :expires'), {
				expires: Date.now(),
			}).execute(),
		)
		.map(destroy);

const updateSessionExpireTime = (
	schema: Schema,
	session: UserSession,
): AsyncEither<MemberCreateError, UserSession> =>
	session.type === SessionType.SCAN_ADD ||
	session.type === SessionType.PASSWORD_RESET ||
	session.type === SessionType.IN_PROGRESS_MFA
		? asyncRight(session, MemberCreateError.UNKOWN_SERVER_ERROR)
		: asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
				.map(s => s.getCollection<UserSession>(SESSION_TABLE))
				.map(collection =>
					modifyAndBind(collection, {
						id: session.id,
					})
						.patch({
							expires: Date.now() + SESSION_AGES[session.type],
						})
						.execute(),
				)
				.map(
					always({
						...session,
						expires: Date.now() + SESSION_AGES[session.type],
					}),
				);

const getSessionFromID = (
	schema: Schema,
	sessionID: SessionID,
): AsyncEither<MemberCreateError, UserSession> =>
	asyncRight<MemberCreateError, Schema>(schema, MemberCreateError.SERVER_ERROR)
		.map(s => s.getCollection<UserSession>(SESSION_TABLE))
		.map(collection => collectResults(findAndBind(collection, { id: sessionID })))
		.filter(sessions => sessions.length === 1, MemberCreateError.INVALID_SESSION_ID)
		.map(get(0))
		.map(session => stripProp('_id')(session as any) as UserSession);

export const createSessionForUser = (
	schema: Schema,
	userAccount: SafeUserAccountInformation,
): AsyncEither<ServerError, UserSession> =>
	asyncRight<ServerError, Buffer>(
		promisedRandomBytes(SESSION_ID_BYTE_COUNT),
		errorGenerator('Could not create session for user'),
	)
		.map<string>(bytes => bytes.toString('hex'))
		.map<UserSession<MemberReference>>(sessionID => ({
			id: sessionID,
			expires: Date.now() + SESSION_AGES[SessionType.REGULAR],
			userAccount,
			sessionData: null,
			type: SessionType.REGULAR,
		}))
		.flatMap(session => addSessionToDatabase(schema, session));

export const updateSession = <S extends UserSession>(
	schema: Schema,
	session: S,
): AsyncEither<ServerError, S> =>
	asyncRight<ServerError, S>(session, errorGenerator('Could not update user session'))
		.map(sess =>
			modifyAndBind(schema.getCollection<UserSession>(SESSION_TABLE), {
				id: sess.id,
			}),
		)
		.map(modify => modify.patch(session).execute())
		.map(always(session));

export const restoreFromSession = (schema: Schema) => (account: AccountObject) => <
	T extends MemberReference = MemberReference
>(
	session: UserSession<T>,
) =>
	AsyncEither.All([
		asyncRight(
			getPermissionsForMemberInAccountDefault(schema, session.userAccount.member, account),
			errorGenerator('Could not get permissions for member'),
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
		.map<ActiveSession<T>>(user =>
			session.type === SessionType.SCAN_ADD
				? {
						expires: session.expires,
						id: session.id,
						type: session.type,
						user,
						userAccount: session.userAccount,
						sessionData: session.sessionData,
				  }
				: {
						expires: session.expires,
						id: session.id,
						type: session.type,
						user,
						userAccount: session.userAccount,
				  },
		);

export const validateSession = (
	schema: Schema,
	sessionID: SessionID,
): AsyncEither<MemberCreateError, UserSession> =>
	removeOldSessions(schema)
		.flatMap(() => getSessionFromID(schema, sessionID))
		.flatMap(session => updateSessionExpireTime(schema, session));

export function memberRequestTransformer(
	memberRequired: false,
): <T extends BasicAccountRequest>(
	req: T,
) => AsyncEither<
	ServerError,
	BasicMaybeMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;
export function memberRequestTransformer(
	memberRequired: true,
): <T extends BasicAccountRequest>(
	req: T,
) => AsyncEither<
	ServerError,
	BasicMemberRequest<T extends BasicAccountRequest<infer P> ? P : never>
>;

export function memberRequestTransformer(memberRequired: boolean = false) {
	return <T extends BasicAccountRequest>(
		req: T,
	): AsyncEither<ServerError, BasicMaybeMemberRequest | BasicMemberRequest> =>
		new AsyncEither(
			(!!req.headers.cookie
				? asyncRight(
						parse(req.headers.cookie),
						errorGenerator('Could not get session information'),
				  ).map<string | undefined>(cookies => cookies.sessionID)
				: asyncRight<ServerError, string | undefined>(
						req.headers.authorization,
						errorGenerator('Could not get session information'),
				  )
			)
				.filter(cookie => !!cookie, {
					type: 'OTHER',
					code: 403,
					message: 'Authorization token not provided',
				})
				.flatMap<UserSession>(authToken =>
					validateSession(req.mysqlx, authToken!).leftMap(
						code => ({
							type: 'OTHER',
							code: 400,
							message: MEMBER_CREATE_ERRORS[code],
						}),
						errorGenerator('Could not validate sesion'),
					),
				)
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
						} as T & BasicMaybeMemberRequest),
				),
			errorGenerator('Could not get user information'),
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

//#endregion

//#region Tokens

const TOKEN_BYTE_COUNT = 64;
const TOKEN_AGE = 20 * 1000;
const TOKEN_TABLE = 'Tokens';

interface TokenObject {
	token: string;
	created: number;
	member: SafeUserAccountInformation;
}

const addTokenToDatabase = async (
	schema: Schema,
	token: string,
	member: SafeUserAccountInformation,
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
	user: SafeUserAccountInformation,
): Promise<string> => {
	const token = (await promisedRandomBytes(TOKEN_BYTE_COUNT)).toString('hex');

	await addTokenToDatabase(schema, token, user);

	return token;
};

export const isTokenValid = async (
	schema: Schema,
	user: MemberReference,
	token: string,
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
	token: string,
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

type ReqWithSessionType<
	R extends { session: MaybeObj<ActiveSession> | ActiveSession },
	T extends SessionType
> = Omit<R, 'session'> & {
	session: R['session'] extends MaybeObj<ActiveSession>
		? MaybeObj<
				SessionForSessionType<T, MemberReference> & {
					user: User;
				}
		  >
		: SessionForSessionType<T, MemberReference> & {
				user: User;
		  };
};

export const RequireSessionType = <T extends SessionType>(...sessionTypes: T[]) => <
	R extends { session: MaybeObj<ActiveSession> | ActiveSession },
	V
>(
	f: (req: ReqWithSessionType<R, T>) => ServerEither<V>,
) => (req: R): ServerEither<V> =>
	('hasValue' in req.session
		? req.session.hasValue && sessionTypes.includes(req.session.value.type as T)
			? asyncRight<ServerError, ReqWithSessionType<R, T>>(
					(req as unknown) as ReqWithSessionType<R, T>,
					errorGenerator('Could not process request'),
			  )
			: asyncLeft<ServerError, ReqWithSessionType<R, T>>({
					type: 'OTHER',
					code: 403,
					message:
						'Member cannot perform the requested action with their current session. Try signing out and back in',
			  })
		: sessionTypes.includes(req.session.type as T)
		? asyncRight<ServerError, ReqWithSessionType<R, T>>(
				(req as unknown) as ReqWithSessionType<R, T>,
				errorGenerator('Could not process request'),
		  )
		: asyncLeft<ServerError, ReqWithSessionType<R, T>>({
				type: 'OTHER',
				code: 403,
				message:
					'Member cannot perform the requested action with their current session. Try signing out and back in',
		  })
	).flatMap(f);

//#endregion

//#region MFA

export const startMFASetupFunc = (generateSecret: typeof speakeasy.generateSecret) => (
	schema: Schema,
) => (member: MemberReference) =>
	asyncRight(
		Promise.all([
			findAndBind(schema.getCollection<StoredMFASecret>('MFASetup'), {
				member: toReference(member),
			}),
			findAndBind(schema.getCollection<StoredMFASecret>('MFATokens'), {
				member: toReference(member),
			}),
		]),
		errorGenerator('Could not save MFA setup'),
	)
		.map(([bind1, bind2]) => Promise.all([collectResults(bind1), collectResults(bind2)]))
		.filter(([results1, results2]) => results1.length === 0 && results2.length === 0, {
			type: 'OTHER',
			code: 400,
			message: 'Cannot setup MFA with MFA already enabled',
		})
		.flatMap(() =>
			asyncRight(
				generateSecret({
					otpauth_url: true,
					name: 'EvMPlus.org',
					length: 64,
				}),
				errorGenerator('Could not generate MFA secrets'),
			).flatMap(({ otpauth_url, base32 }) =>
				asyncRight(
					{
						member: toReference(member),
						secret: base32,
					},
					errorGenerator('Could not save MFA secret'),
				)
					.map(addToCollection(schema.getCollection<StoredMFASecret>('MFASetup')))
					.map(always(otpauth_url)),
			),
		);
export const startMFASetup = startMFASetupFunc(speakeasy.generateSecret);

/**
 * Used because for some reason, generating a token and comparing it works better than using
 * the verify function (which generates a token and compares it?)
 *
 * Has to do with stupid JavaScript bind rules...
 */
const innerVerifyToken = (totp: Totp) => (secret: string) => (token: string) => {
	const innerToken = totp({
		secret,
		encoding: 'base32',
	});

	return token === innerToken;
};

export const finishMFASetupFunc = (totp: Totp) => (schema: Schema) => (member: MemberReference) => (
	token: string,
) =>
	asyncRight(
		findAndBind(schema.getCollection<StoredMFASecret>('MFASetup'), {
			member: toReference(member),
		}),
		errorGenerator('Could not save MFA setup'),
	)
		.map(collectResults)
		.map(Maybe.fromArray)
		.flatMap<StoredMFASecret>(res =>
			Maybe.isSome(res)
				? asyncRight(res.value, errorGenerator('Could not save MFA setup'))
				: asyncLeft({
						type: 'OTHER',
						code: 400,
						message: 'No MFA setup exists to finish setting up',
				  }),
		)
		.flatMap<StoredMFASecret>(res =>
			innerVerifyToken(totp)(res.secret)(token)
				? asyncRight(res, errorGenerator('Could not save MFA setup'))
				: asyncLeft({
						type: 'OTHER',
						code: 400,
						message: 'Token provided is invalid',
				  }),
		)
		.tap(res =>
			Promise.all([
				schema
					.getCollection<StoredMFASecret>('MFASetup')
					.remove('member.id = :member_id AND member.type = :member_type')
					// @ts-ignore
					.bind('member_id', member.id)
					// @ts-ignore
					.bind('member_type', member.type)
					.execute(),
				schema.getCollection<StoredMFASecret>('MFATokens').add(res).execute(),
			]),
		)
		.map(destroy);
export const finishMFASetup = finishMFASetupFunc(speakeasy.totp.bind(speakeasy));

export const verifyMFATokenFunc = (totp: Totp) => (schema: Schema) => (member: MemberReference) => (
	token: string,
) =>
	asyncRight(
		findAndBind(schema.getCollection<StoredMFASecret>('MFATokens'), {
			member: toReference(member),
		}),
		errorGenerator('Could not save MFA setup'),
	)
		.map(collectResults)
		.map(Maybe.fromArray)
		.flatMap<StoredMFASecret>(res =>
			Maybe.isSome(res)
				? asyncRight(res.value, errorGenerator('Could not verify token'))
				: asyncLeft({
						type: 'OTHER',
						code: 400,
						message: 'No MFA setup exists',
				  }),
		)
		.flatMap<void>(res =>
			innerVerifyToken(totp)(res.secret)(token)
				? asyncRight(void 0, errorGenerator('Could not verify token'))
				: asyncLeft({
						type: 'OTHER',
						code: 400,
						message: 'Token provided is invalid',
				  }),
		);
export const verifyMFAToken = verifyMFATokenFunc(speakeasy.totp.bind(speakeasy));

export const memberUsesMFA = (schema: Schema) => (member: MemberReference) =>
	asyncRight(
		findAndBind(schema.getCollection<StoredMFASecret>('MFATokens'), {
			member: toReference(member),
		}),
		errorGenerator('Could not check MFA tokens'),
	)
		.map(collectResults)
		.map(({ length }) => length === 1);

//#endregion
