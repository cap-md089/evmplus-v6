import { Schema } from '@mysql/xdevapi';
import { promisify } from 'bluebird';
import {
	MemberPermissions,
	MemberReference,
	NoSQLDocument,
	PasswordSetResult,
	StoredMemberPermissions,
	UserAccountInformation
} from 'common-lib';
import { randomBytes } from 'crypto';
import {
	Account,
	addPasswordForUser,
	collectResults,
	findAndBind,
	Member,
	resolveReference
} from '../../internals';
import { safeBind } from '../../MySQLUtil';

//#region Account creation

interface AccountCreationToken {
	member: MemberReference;
	created: number;
	token: string;
}

const ACCOUNT_TOKEN_AGE = 24 * 60 * 60 * 1000;

const getUserAccountCreationTokens = async (
	schema: Schema,
	token: string
): Promise<AccountCreationToken[]> => {
	await cleanAccountCreationTokens(schema);

	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	return collectResults(
		findAndBind(collection, {
			token
		})
	);
};

const cleanAccountCreationTokens = async (schema: Schema): Promise<void> => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await safeBind(collection.remove('created < :created'), {
		created: Date.now() - ACCOUNT_TOKEN_AGE
	}).execute();
};

const removeAccountToken = async (schema: Schema, token: string): Promise<void> => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await safeBind(collection.remove('token = :token'), { token }).execute();
};

const getTokenCountForUser = async (schema: Schema, member: MemberReference) => {
	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	const results = await collectResults(findAndBind(collection, { member }));

	return results.length;
};

export const addUserAccountCreationToken = async (
	schema: Schema,
	member: MemberReference
): Promise<string> => {
	let info = null;
	try {
		info = await getInformationForMember(schema, member);
	} catch (e) {
		// If this happens, then everything is ok
		// An account couldn't be found, which means the request is valid
	}

	if (info !== null) {
		throw new Error('User already has an account');
	}

	const tokenCount = await getTokenCountForUser(schema, member);
	if (tokenCount > 0) {
		throw new Error('User already has token');
	}

	const token = (await promisify(randomBytes)(48)).toString('hex');

	const collection = schema.getCollection<AccountCreationToken>('UserAccountTokens');

	await collection
		.add({
			member,
			created: Date.now(),
			token
		})
		.execute();

	return token;
};

export const validateUserAccountCreationToken = async (
	schema: Schema,
	token: string
): Promise<MemberReference> => {
	await cleanAccountCreationTokens(schema);

	const tokens = await getUserAccountCreationTokens(schema, token);

	if (tokens.length !== 1) {
		throw new Error('Could not match user account creation token');
	}

	return tokens[0].member;
};

export class UserError extends Error {}

export const addUserAccount = async (
	schema: Schema,
	account: Account,
	username: string,
	password: string,
	member: MemberReference,
	token: string
): Promise<UserAccountInformation> => {
	const userInformationCollection = schema.getCollection<UserAccountInformation>(
		'UserAccountInfo'
	);

	let user = null;
	try {
		user = await getInformationForUser(schema, username);
	} catch (e) {
		// do nothing, as user will still be null and we can check later
	}

	if (isUserValid(user)) {
		throw new UserError('Account already exists with given username');
	}

	// Checks for account and password
	// It is possible for an account to exist without a password,
	// as during the account creation phase a password may fail to meet
	// requirements and leave a dangling, inaccessible account
	const resultsForReference = await collectResults(
		findAndBind(userInformationCollection, {
			member
		})
	);
	if (
		!(resultsForReference.length === 0 || resultsForReference[0].passwordHistory.length === 0)
	) {
		throw new UserError('Account already exists for member');
	}

	try {
		await resolveReference(member, account, schema, true);
	} catch (e) {
		throw new UserError('Member does not exist');
	}

	const newAccount: UserAccountInformation = {
		member,
		username,
		passwordHistory: []
	};

	// Only add a copy if the member actually needs to be added
	// There are cases where a member may be added, just not fully made
	if (user === null) {
		await userInformationCollection.add(newAccount).execute();
	}

	const passwordResult = await addPasswordForUser(schema, username, password);

	if (passwordResult === PasswordSetResult.COMPLEXITY) {
		throw new UserError('Password does not meet complexity requirements');
	}

	await removeAccountToken(schema, token);

	return newAccount;
};

//#endregion

//#region Basic account information

/**
 * Loads information about a user from the database
 *
 * @param schema the database to get information from
 * @param member the member to get information for
 */
export const getInformationForMember = async (
	schema: Schema,
	member: MemberReference
): Promise<UserAccountInformation & Required<NoSQLDocument>> => {
	const userInformationCollection = schema.getCollection<
		UserAccountInformation & Required<NoSQLDocument>
	>('UserAccountInfo');

	const userList = await collectResults(
		findAndBind(userInformationCollection, {
			member
		})
	);

	if (userList.length !== 1) {
		throw new Error('Could not find user specified');
	}

	return userList[0];
};

/**
 * Loads information about a user from the database
 *
 * @param schema the database to get information from
 * @param username the member to get information for
 */
export const getInformationForUser = async (
	schema: Schema,
	username: string
): Promise<UserAccountInformation & Required<NoSQLDocument>> => {
	const userInformationCollection = schema.getCollection<
		UserAccountInformation & Required<NoSQLDocument>
	>('UserAccountInfo');

	const userList = await collectResults(
		findAndBind(userInformationCollection, {
			username
		})
	);

	if (userList.length !== 1) {
		throw new Error('Could not find user specified');
	}

	return userList[0];
};

/**
 * Updates information for a user
 *
 * Requires the information to already be in the database to update, and requires member to have been pulled using
 * `getInformationForUser`
 *
 * @param schema the database to update. assumes the information already exists, just needs to be updated
 * @param member the information to save. this needs to be information previously pulled, just tweaked
 */
export const saveInformationForUser = async (
	schema: Schema,
	member: UserAccountInformation & Required<NoSQLDocument>
) => {
	const userInformationCollection = schema.getCollection<
		UserAccountInformation & Required<NoSQLDocument>
	>('UserAccountInfo');

	await userInformationCollection.replaceOne(member._id, member);
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
	account: Account
): Promise<StoredMemberPermissions & Required<NoSQLDocument>> => {
	const permissionsCollection = schema.getCollection<
		StoredMemberPermissions & Required<NoSQLDocument>
	>(MEMBER_PERMISSIONS_TABLE);

	const permissions = await collectResults(
		findAndBind(permissionsCollection, { member, accountID: account.id })
	);

	if (permissions.length !== 1) {
		throw new Error('Could not get permissions for user');
	}

	return permissions[0];
};

export const DEFAULT_PERMISSIONS: Readonly<MemberPermissions> = Member;

export const getPermissionsForMemberInAccountDefault = async (
	schema: Schema,
	member: MemberReference,
	account: Account
): Promise<MemberPermissions> => {
	try {
		return await getPermissionsForMemberInAccount(schema, member, account);
	} catch (e) {
		return DEFAULT_PERMISSIONS;
	}
};

export const getPermissionsForMemberInAccount = async (
	schema: Schema,
	member: MemberReference,
	account: Account
): Promise<MemberPermissions> => {
	const record = await getPermissionsRecordForMemberInAccount(schema, member, account);

	return record.permissions;
};

export const setPermissionsForMemberInAccount = async (
	schema: Schema,
	member: MemberReference,
	permissions: MemberPermissions,
	account: Account
): Promise<void> => {
	const permissionsCollection = schema.getCollection<StoredMemberPermissions>(
		MEMBER_PERMISSIONS_TABLE
	);

	try {
		const record = await getPermissionsRecordForMemberInAccount(schema, member, account);

		record.permissions = permissions;

		await permissionsCollection.replaceOne(record._id, record);
	} catch (e) {
		// couldn't get permissions to update, they have to be added

		await permissionsCollection
			.add({
				accountID: account.id,
				member,
				permissions
			})
			.execute();
	}
};

//#endregion
