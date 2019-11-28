import { Schema } from '@mysql/xdevapi';
import {
	AccountPasswordInformation,
	passwordMeetsRequirements,
	PasswordResult,
	PasswordSetResult,
	UserAccountInformation
} from 'common-lib';
import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { getInformationForUser, isUserValid, saveInformationForUser } from '../../internals';

const promisedPbkdf2 = promisify(pbkdf2);
const promisedRandomBytes = promisify(randomBytes);

export const DEFAULT_PASSWORD_ITERATION_COUNT = 32768;
export const DEFAULT_PASSWORD_STORED_LENGTH = 64;
export const DEFAULT_SALT_SIZE = 128;
export const PASSWORD_HISTORY_LENGTH = 5;
export const PASSWORD_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export const PASSWORD_MIN_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Hashes the password according to the specified parameters
 *
 * Mostly serves as an interface with PBKDF2 using some default parameters
 *
 * @param password the password to hash
 * @param salt the salt for the password
 * @param length the length of the result
 * @param iterationCount the iterations to use
 */
export const hashPassword = async (
	password: string,
	salt: string,
	length = DEFAULT_PASSWORD_STORED_LENGTH,
	iterationCount = DEFAULT_PASSWORD_ITERATION_COUNT
): Promise<Buffer> => promisedPbkdf2(password, salt, iterationCount, length, 'sha512');

/**
 * Checks a password against an account
 *
 * @param info the user account to check against
 * @param password the password to check
 */
export const isPasswordValidForUser = async (info: UserAccountInformation, password: string) => {
	const pwInfo = info.passwordHistory[0];
	const iterations = pwInfo.iterations;
	const salt = pwInfo.salt;
	const hashStored = pwInfo.password;

	const hashCalced = await hashPassword(password, salt, hashStored.length / 2, iterations);

	return hashStored === hashCalced.toString('hex');
};

/**
 * Checks if a password has been used in the specified history
 *
 * @param password the password to check the use for
 * @param passwordHistory the password history to check through
 */
export const hasPasswordBeenUsed = async (
	password: string,
	passwordHistory: AccountPasswordInformation[]
): Promise<boolean> =>
	// Hash the password according to each of the parameters stored, generating multiple passwords that
	// are hashed to different parameters
	(await Promise.all(
		passwordHistory.map(pw =>
			hashPassword(password, pw.salt, pw.password.length / 2, pw.iterations)
		)
	))
		// Check if each one (as a hex string) equals a password in its history
		.map((pw, i) => pw.toString('hex') === passwordHistory[i].password)
		// Reduce to a single variable
		.reduce((prev, curr) => prev || curr, false);

/**
 * Updates the password for the user specified
 *
 * Does not perform security checks, as it is intended solely for updating iteration count or length
 *
 * @param schema the database the information is stored in
 * @param userID the user to update the password for
 * @param password the password to set
 */
export const updatePasswordForUser = async (
	schema: Schema,
	username: string,
	password: string
): Promise<void> => {
	const userInfo = await getInformationForUser(schema, username);

	const salt = (await promisedRandomBytes(DEFAULT_SALT_SIZE)).toString('hex');
	const newHashedPassword = await hashPassword(password, salt);

	userInfo.passwordHistory[0].password = newHashedPassword.toString('hex');
	userInfo.passwordHistory[0].iterations = DEFAULT_PASSWORD_ITERATION_COUNT;
	userInfo.passwordHistory[0].salt = salt;

	await saveInformationForUser(schema, userInfo);
};

/**
 * Adds a password to the user, adding the new password to the history
 *
 * Does perform security checks, unlinke `updatePasswordForUser`
 *
 * @param schema the schema that stores the account information
 * @param userID the ID of the user to update the password for
 * @param password the password to set
 */
export const addPasswordForUser = async (
	schema: Schema,
	username: string,
	password: string
): Promise<PasswordSetResult> => {
	const userInfo = await getInformationForUser(schema, username);

	// Necessary for the case that the user doesn't have a password yet
	if (userInfo.passwordHistory.length > 0) {
		const passwordMinAge = userInfo.passwordHistory[0].created + PASSWORD_MIN_AGE;
		if (passwordMinAge > Date.now()) {
			return PasswordSetResult.MIN_AGE;
		}
	}

	if (!passwordMeetsRequirements(password)) {
		return PasswordSetResult.COMPLEXITY;
	}

	if (await hasPasswordBeenUsed(password, userInfo.passwordHistory)) {
		return PasswordSetResult.IN_HISTORY;
	}

	const salt = (await promisedRandomBytes(DEFAULT_SALT_SIZE)).toString('hex');
	const newPassword = (await hashPassword(password, salt)).toString('hex');

	userInfo.passwordHistory.unshift({
		created: Date.now(),
		password: newPassword,
		salt,
		iterations: DEFAULT_PASSWORD_ITERATION_COUNT
	});

	while (userInfo.passwordHistory.length > PASSWORD_HISTORY_LENGTH) {
		userInfo.passwordHistory.pop();
	}

	await saveInformationForUser(schema, userInfo);

	return PasswordSetResult.OK;
};

/**
 * Checks if a password is valid for the provided member
 *
 * @param schema the schema to check if valid against
 * @param userID the user ID to check for validity for
 * @param password the password to check against the account
 */
export const checkIfPasswordValid = async (
	schema: Schema,
	username: string,
	password: string
): Promise<PasswordResult> => {
	let userInfo;
	try {
		userInfo = await getInformationForUser(schema, username);
	} catch (e) {
		return PasswordResult.INVALID;
	}

	if (!isUserValid(userInfo)) {
		return PasswordResult.INVALID;
	}

	if (!(await isPasswordValidForUser(userInfo, password))) {
		return PasswordResult.INVALID;
	}

	// Keep password up to date with hardware
	if (
		userInfo.passwordHistory[0].iterations !== DEFAULT_PASSWORD_ITERATION_COUNT ||
		userInfo.passwordHistory[0].password.length !== DEFAULT_PASSWORD_STORED_LENGTH
	) {
		await updatePasswordForUser(schema, username, password);
	}

	const passwordExpireDate = userInfo.passwordHistory[0].created + PASSWORD_MAX_AGE;
	if (passwordExpireDate < Date.now()) {
		return PasswordResult.VALID_EXPIRED;
	}

	return PasswordResult.VALID;
};
