import { Schema } from '@mysql/xdevapi';
import {
	AccountPasswordInformation,
	AlgorithmType,
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	none,
	passwordMeetsRequirements,
	PasswordResetTokenInformation,
	PasswordResult,
	PasswordSetResult,
	UserAccountInformation
} from 'common-lib';
import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { getInformationForUser, isUserValid, saveInformationForUser } from '../../internals';
import {
	collectResults,
	findAndBind,
	generateBindObject,
	generateFindStatement
} from '../../MySQLUtil';
import { serverErrorGenerator } from '../../Util';

const promisedPbkdf2 = promisify(pbkdf2);
const promisedRandomBytes = promisify(randomBytes);

const PASSWORD_RESET_TOKEN_COLLECTION = 'PasswordResetTokens';

export const DEFAULT_PASSWORD_ITERATION_COUNT = 32768;
export const DEFAULT_PASSWORD_STORED_LENGTH = 128;
export const DEFAULT_SALT_SIZE = 128;
export const PASSWORD_HISTORY_LENGTH = 5;
export const PASSWORD_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export const PASSWORD_MIN_AGE = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_NEW_ALGORITHM: AlgorithmType = 'pbkdf2';
export const PASSWORD_RESET_TOKEN_EXPIRE_TIME = 24 * 60 * 60 * 1000;

const algorithms: {
	[key: string]: (
		password: string,
		salt: string,
		iterationCount: number,
		length: number,
		algorithm: string
	) => Promise<Buffer>;
} = {
	pbkdf2: promisedPbkdf2
};

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
	algorithm: AlgorithmType,
	length = DEFAULT_PASSWORD_STORED_LENGTH,
	iterationCount = DEFAULT_PASSWORD_ITERATION_COUNT
): Promise<Buffer> => algorithms[algorithm](password, salt, iterationCount, length, 'sha512');

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
	const algorithm = pwInfo.algorithm || 'pbkdf2';

	const hashCalced = await hashPassword(
		password,
		salt,
		algorithm,
		hashStored.length / 2,
		iterations
	);

	const calcedHashString = hashCalced.toString('hex');

	// Take time to compare each character, making each comparison similar in length

	let equal = true;

	for (let i = 0; i < hashStored.length; i++) {
		if (hashStored[i] !== calcedHashString[i]) {
			equal = false;
		}
	}

	return equal;
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
	(
		await Promise.all(
			passwordHistory.map(pw =>
				hashPassword(
					password,
					pw.salt,
					pw.algorithm || 'pbkdf2',
					pw.password.length / 2,
					pw.iterations
				)
			)
		)
	)
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
	const newHashedPassword = await hashPassword(password, salt, PASSWORD_NEW_ALGORITHM);

	userInfo.passwordHistory[0].password = newHashedPassword.toString('hex');
	userInfo.passwordHistory[0].iterations = DEFAULT_PASSWORD_ITERATION_COUNT;
	userInfo.passwordHistory[0].salt = salt;
	userInfo.passwordHistory[0].algorithm = PASSWORD_NEW_ALGORITHM;

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

	if (!passwordMeetsRequirements(password)) {
		return PasswordSetResult.COMPLEXITY;
	}

	if (await hasPasswordBeenUsed(password, userInfo.passwordHistory)) {
		return PasswordSetResult.IN_HISTORY;
	}

	const salt = (await promisedRandomBytes(DEFAULT_SALT_SIZE)).toString('hex');
	const newPassword = (await hashPassword(password, salt, PASSWORD_NEW_ALGORITHM)).toString(
		'hex'
	);

	userInfo.passwordHistory.unshift({
		created: Date.now(),
		password: newPassword,
		salt,
		iterations: DEFAULT_PASSWORD_ITERATION_COUNT,
		algorithm: PASSWORD_NEW_ALGORITHM
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

export const createPasswordResetToken = (
	schema: Schema,
	username: string
): AsyncEither<api.ServerError, string> =>
	asyncRight(
		promisedRandomBytes(48),
		serverErrorGenerator('Could not generate password reset token')
	)
		.map(token => token.toString('hex'))
		.flatMap(token =>
			asyncRight(
				schema.getCollection<PasswordResetTokenInformation>(
					PASSWORD_RESET_TOKEN_COLLECTION
				),
				serverErrorGenerator('Could not create password reset token')
			)
				.flatMap(collection =>
					asyncRight(
						// Verify that the username is valid
						getInformationForUser(schema, username),
						serverErrorGenerator('Could not get user information')
					).map(
						() =>
							collection
								.add({
									expires: Date.now() + PASSWORD_RESET_TOKEN_EXPIRE_TIME,
									username,
									token
								})
								.execute(),
						serverErrorGenerator('Could not save password reset token')
					)
				)
				.map(() => token)
		);

export const validatePasswordResetToken = (
	schema: Schema,
	token: string
): AsyncEither<api.ServerError, string> =>
	asyncRight(
		schema.getCollection<PasswordResetTokenInformation>(PASSWORD_RESET_TOKEN_COLLECTION),
		serverErrorGenerator('Could not validate password reset token')
	)
		.tap(collection =>
			collection
				.remove('expires < :expires')
				.bind('expires', Date.now())
				.execute()
		)
		.flatMap(collection =>
			asyncRight(
				findAndBind(collection, { token }),
				serverErrorGenerator('Could not validate password reset token')
			)
				.map(find => collectResults(find))
				.flatMap(results =>
					results.length === 1
						? asyncRight(
								results[0].username,
								serverErrorGenerator('Could not handle token')
						  )
						: asyncLeft({
								error: none<Error>(),
								code: 400,
								message: 'Could not validate password reset token'
						  })
				)
		);

export const removePasswordValidationToken = (
	schema: Schema,
	token: string
): AsyncEither<api.ServerError, void> =>
	asyncRight(
		schema.getCollection<PasswordResetTokenInformation>(PASSWORD_RESET_TOKEN_COLLECTION),
		serverErrorGenerator('Could not validate password reset token')
	)
		.tap(collection =>
			collection
				.remove('expires < :expires')
				.bind('expires', Date.now())
				.execute()
		)
		.map(collection =>
			collection
				.remove(
					generateFindStatement<PasswordResetTokenInformation>({
						token
					})
				)
				.bind(
					generateBindObject<PasswordResetTokenInformation>({
						token
					})
				)
				.execute()
		)
		.map(() => void 0);
