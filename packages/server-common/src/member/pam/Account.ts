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
import { promisify } from 'bluebird';
import {
	AccountObject,
	always,
	AsyncEither,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	getDefaultMemberPermissions,
	hasPermission,
	Maybe,
	MaybeObj,
	MemberForMemberType,
	MemberPermission,
	MemberPermissions,
	MemberReference,
	MemberType,
	PasswordSetResult,
	SafeUserAccountInformation,
	ServerError,
	StoredMemberPermissions,
	stripProp,
	toReference,
	User,
	UserAccountInformation,
} from 'common-lib';
import { randomBytes } from 'crypto';
import { resolveReference } from '../../Members';
import {
	collectResults,
	findAndBind,
	generateResults,
	modifyAndBind,
	safeBind,
} from '../../MySQLUtil';
import { ServerEither } from '../../servertypes';
import { addPasswordForUser } from './Password';

//#region Account creation

interface AccountCreationToken {
	member: MemberReference;
	created: number;
	token: string;
}

const ACCOUNT_TOKEN_AGE = 24 * 60 * 60 * 1000;

const getUserAccountCreationTokens = async (
	schema: Schema,
	token: string,
): Promise<AccountCreationToken[]> => {
	await cleanAccountCreationTokens(schema);

	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	const results = generateResults(
		findAndBind(collection, {
			token,
		}),
	);

	return collectGeneratorAsync<AccountCreationToken>(
		asyncIterMap<AccountCreationToken, AccountCreationToken>(stripProp('_id'))(results),
	);
};

const cleanAccountCreationTokens = async (schema: Schema): Promise<void> => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await safeBind(collection.remove('created < :created'), {
		created: Date.now() - ACCOUNT_TOKEN_AGE,
	}).execute();
};

const removeAccountToken = async (schema: Schema, token: string): Promise<void> => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await safeBind(collection.remove('token = :token'), { token }).execute();
};

const getTokenCountForUser = async (schema: Schema, member: MemberReference) => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await cleanAccountCreationTokens(schema);

	const results = await collectResults(findAndBind(collection, { member }));

	return results.length;
};

export const addUserAccountCreationToken = (schema: Schema, member: MemberReference) =>
	asyncRight<ServerError, MaybeObj<UserAccountInformation>>(
		getInformationForMember(schema, member)
			.then(simplifyUserInformation)
			.then(Maybe.some)
			.catch(Maybe.none),
		errorGenerator('Could not get user account information'),
	)
		.filter(Maybe.isNone, {
			type: 'OTHER',
			code: 400,
			message: 'User already has an account',
		})
		.map(
			() => getTokenCountForUser(schema, member),
			errorGenerator('Could not get user creation information'),
		)
		.filter(count => count === 0, {
			type: 'OTHER',
			code: 400,
			message: 'User is already in the process of creating an account',
		})
		.map(() => promisify(randomBytes)(48))
		.map(token => token.toString('hex'))
		.tap(token =>
			asyncRight(
				{
					token,
					member,
					created: Date.now(),
				},
				errorGenerator('Could not store user creation information'),
			).map(tokenInfo =>
				schema
					.getCollection<AccountCreationToken>('UserAccountTokens')
					.add(tokenInfo)
					.execute(),
			),
		);

export const validateUserAccountCreationToken = async (
	schema: Schema,
	token: string,
): Promise<MemberReference> => {
	await cleanAccountCreationTokens(schema);

	const tokens = await getUserAccountCreationTokens(schema, token);

	if (tokens.length !== 1) {
		throw new Error('Could not match user account creation token');
	}

	return tokens[0].member;
};

export const addUserAccount = (
	schema: Schema,
	account: AccountObject,
	username: string,
	password: string,
	member: MemberReference,
	token: string,
	// ): AsyncEither<ServerError, UserAccountInformation> =>
): AsyncEither<ServerError, any> =>
	asyncRight(
		schema.getCollection<UserAccountInformation>('UserAccountInfo'),
		errorGenerator('Could not create user account information'),
	).flatMap(userInformationCollection =>
		asyncRight(
			getInformationForUser(schema, username)
				.then(Maybe.some)
				.catch(Maybe.none),
			errorGenerator('Could not get user account information'),
		)
			.filter(user => Maybe.isNone(user) || !isUserValid(user.value), {
				type: 'OTHER',
				code: 400,
				message: 'Account already exists with the given username',
			})
			.filter(
				async () => {
					const resultsForReference = await collectResults(
						findAndBind(userInformationCollection, {
							member: toReference(member),
						}),
					);

					return (
						resultsForReference.length !== 1 ||
						resultsForReference[0].passwordHistory.length === 0
					);
				},
				{
					type: 'OTHER',
					code: 400,
					message: 'Account already exists for member',
				},
			)
			.filter(
				() =>
					resolveReference(schema)(account)(member)
						.map(always(true))
						.leftFlatMap(always(Either.right(false))),
				{
					type: 'OTHER',
					code: 400,
					message: 'Member does not exist',
				},
			)
			.map(async user => {
				if (Maybe.isNone(user)) {
					const newAccount: UserAccountInformation = {
						member,
						username,
						passwordHistory: [],
					};

					await userInformationCollection.add(newAccount).execute();

					return newAccount;
				} else {
					return user.value;
				}
			})
			.flatMap(() =>
				addPasswordForUser(schema, username, password).cata<
					EitherObj<ServerError, UserAccountInformation>
				>(
					result =>
						result === PasswordSetResult.COMPLEXITY
							? Either.left({
									type: 'OTHER',
									code: 400,
									message: 'Password does not meet complexity requirements',
							  })
							: Either.left({
									type: 'OTHER',
									code: 400,
									message: 'There was an unknown server error',
							  }),
					Either.right,
				),
			)
			.tap(() => removeAccountToken(schema, token)),
	);

//#endregion

//#region Basic account information

/**
 * Loads information about a user from the database
 *
 * @param schema the database to get information from
 * @param member the member to get information for
 */
export const getInformationForMember = async <T extends MemberReference>(
	schema: Schema,
	member: T,
): Promise<UserAccountInformation<T>> => {
	const userInformationCollection = schema.getCollection<UserAccountInformation>(
		'UserAccountInfo',
	);

	const userList = await collectResults(
		findAndBind(userInformationCollection, {
			member,
		}),
	);

	if (userList.length !== 1) {
		throw new Error('Could not find user specified');
	}

	return stripProp<UserAccountInformation, '_id'>('_id')(userList[0]) as UserAccountInformation<
		T
	>;
};

/**
 * Loads information about a user from the database
 *
 * @param schema the database to get information from
 * @param username the member to get information for
 */
export const getInformationForUser = async (
	schema: Schema,
	username: string,
): Promise<UserAccountInformation> => {
	const userInformationCollection = schema.getCollection<UserAccountInformation>(
		'UserAccountInfo',
	);

	const userList = await collectResults(
		findAndBind(userInformationCollection, {
			username,
		}),
	);

	if (userList.length !== 1) {
		throw new Error('Could not find user specified');
	}

	return stripProp('_id')(userList[0]) as UserAccountInformation;
};

/**
 * Takes user account info and secures it by removing the password history, so that it can safely be
 * passed around to other functions
 *
 * @param userInfo the information to secure
 */
export const simplifyUserInformation = (
	userInfo: UserAccountInformation,
): SafeUserAccountInformation => ({
	...userInfo,
	passwordHistory: [],
});

/**
 * Updates information for a user
 *
 * Requires the information to already be in the database to update, and requires member to have been pulled using
 * `getInformationForUser`
 *
 * @param schema the database to update. assumes the information already exists, just needs to be updated
 * @param member the information to save. this needs to be information previously pulled, just tweaked
 */
export const saveInformationForUser = async (schema: Schema, member: UserAccountInformation) => {
	const userInformationCollection = schema.getCollection<UserAccountInformation>(
		'UserAccountInfo',
	);

	await modifyAndBind(userInformationCollection, {
		member: member.member,
	})
		.patch(member)
		.execute();
};

/**
 * A user that doesn't have a password isn't a valid account, as it is still being set up
 *
 * @param info the user account info
 */
export const isUserValid = (info: UserAccountInformation | null) =>
	!!info && info.passwordHistory.length !== 0;

//#endregion

//#region Permissions

const MEMBER_PERMISSIONS_TABLE = 'UserPermissions';

const getPermissionsRecordForMemberInAccount = async (
	schema: Schema,
	member: MemberReference,
	account: AccountObject,
): Promise<StoredMemberPermissions> => {
	const permissionsCollection = schema.getCollection<StoredMemberPermissions>(
		MEMBER_PERMISSIONS_TABLE,
	);

	const permissions = await collectResults(
		findAndBind(permissionsCollection, { member, accountID: account.id }),
	);

	if (permissions.length !== 1) {
		throw new Error('Could not get permissions for user');
	}

	return stripProp('_id')(permissions[0]) as StoredMemberPermissions;
};

export const getPermissionsForMemberInAccountDefault = async (
	schema: Schema,
	member: MemberReference,
	account: AccountObject,
): Promise<MemberPermissions> => {
	try {
		const permissions = await getPermissionsForMemberInAccount(schema, member, account);

		if (permissions.type !== account.type) {
			return getDefaultMemberPermissions(account.type);
		}

		return permissions;
	} catch (e) {
		return getDefaultMemberPermissions(account.type);
	}
};

export const getPermissionsForMemberInAccount = async (
	schema: Schema,
	member: MemberReference,
	account: AccountObject,
): Promise<MemberPermissions> => {
	const record = await getPermissionsRecordForMemberInAccount(schema, member, account);

	return record.permissions;
};

export const setPermissionsForMemberInAccount = async (
	schema: Schema,
	member: MemberReference,
	permissions: MemberPermissions,
	account: AccountObject,
): Promise<void> => {
	const permissionsCollection = schema.getCollection<StoredMemberPermissions>(
		MEMBER_PERMISSIONS_TABLE,
	);

	try {
		const record = await getPermissionsRecordForMemberInAccount(schema, member, account);

		record.permissions = permissions;

		await modifyAndBind(permissionsCollection, {
			member,
			accountID: account.id,
		})
			.patch({
				permissions,
			})
			.execute();
	} catch (e) {
		// couldn't get permissions to update, they have to be added

		await permissionsCollection
			.add({
				accountID: account.id,
				member,
				permissions,
			})
			.execute();
	}
};

export const RequiresPermission = <T extends MemberPermission>(
	permission: T,
	threshold: number,
	message = 'Member does not have permission to perform the requested action',
) => <R extends { member?: MaybeObj<User> | User }, V>(func: (req: R) => ServerEither<V>) => (
	req: R,
) => checkPermissions(permission)(threshold)(message)(req).flatMap(func);

export const checkPermissions = <T extends MemberPermission>(permission: T) => (
	threshold: number,
) => (message = 'Member does not have permission to perform the requested action') => <
	R extends { member?: MaybeObj<User> | User }
>(
	req: R,
): ServerEither<R> =>
	'member' in req && !!req.member
		? 'hasValue' in req.member
			? req.member.hasValue && hasPermission(permission)(threshold)(req.member.value)
				? asyncRight<ServerError, R>(req, errorGenerator('Could not process request'))
				: asyncLeft<ServerError, R>({
						type: 'OTHER',
						code: 403,
						message,
				  })
			: hasPermission(permission)(threshold)(req.member)
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
		  });

type ReqWithMemberType<R extends { member: MaybeObj<User> | User }, T extends MemberType> = Omit<
	R,
	'member'
> & {
	member: R['member'] extends MaybeObj<User>
		? MaybeObj<MemberForMemberType<T> & User>
		: MemberForMemberType<T> & User;
};

export const RequiresMemberType = <T extends MemberType>(...types: T[]) => <
	R extends { member: MaybeObj<User> | User },
	V
>(
	func: (req: ReqWithMemberType<R, T>) => ServerEither<V>,
) => (req: R): ServerEither<V> =>
	('hasValue' in req.member
		? req.member.hasValue && types.includes(req.member.value.type as T)
			? asyncRight(
					(req as unknown) as ReqWithMemberType<R, T>,
					errorGenerator('Could not process request'),
			  )
			: asyncLeft<ServerError, ReqWithMemberType<R, T>>({
					type: 'OTHER',
					code: 404,
					message: 'This API endpoint does not exist for this member type',
			  })
		: types.includes(req.member.type as T)
		? asyncRight(
				(req as unknown) as ReqWithMemberType<R, T>,
				errorGenerator('Could not process request'),
		  )
		: asyncLeft<ServerError, ReqWithMemberType<R, T>>({
				type: 'OTHER',
				code: 404,
				message: 'This API endpoint does not exist for this member type',
		  })
	).flatMap(func);

//#endregion
