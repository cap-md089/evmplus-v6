import { Schema } from '@mysql/xdevapi';
import {
	MemberCreateError,
	MemberReference,
	PasswordResult,
	UserAccountInformation
} from 'common-lib';
import {
	checkIfPasswordValid,
	collectResults,
	createSessionForUser,
	findAndBind,
	getInformationForUser
} from '../../internals';

interface SigninSuccess {
	result: MemberCreateError.NONE;
	sessionID: string;
	member: MemberReference;
}

interface SigninPasswordOld {
	result: MemberCreateError.PASSWORD_EXPIRED;
}

interface SigninFailed {
	result: MemberCreateError.INCORRRECT_CREDENTIALS;
}

export type SigninResult = SigninSuccess | SigninPasswordOld | SigninFailed;

// Client side key is 6Len_7UUAAAAAD51GOFqCxDw4vjlJkoJ4AKfgbZ3
const captchaSecret = '6Len_7UUAAAAAFsz4wZW6qUpbN_Mirm-guSd4t6a';

const verifyCaptcha = async (response: string, secret = captchaSecret): Promise<boolean> => {
	return true;

	/*try {
		const results = await rp('https://www.google.com/recaptcha/api/siteverify', {
			followRedirect: false,
			method: 'POST',
			form: {
				secret,
				response
			},
			resolveWithFullResponse: false,
			simple: true
		});

		return results.success;
	} catch (e) {
		return false;
	}*/
};

const getUserID = async (schema: Schema, username: string): Promise<MemberReference> => {
	const userMappingCollection = schema.getCollection<UserAccountInformation>('UserAccountInfo');

	const userFinder = findAndBind(userMappingCollection, {
		username
	});

	const userList = await collectResults(userFinder);

	if (userList.length !== 1) {
		throw new Error('Could not find username specified');
	}

	return userList[0].member;
};

/**
 * Tries to sign in given the username and password
 * reCAPTCHA is kept as a placeholder so that it will be easier to add in the future
 *
 * @param schema the database that the account information resides in
 * @param username the username to check
 * @param password the password to verify the username with
 * @param recaptchaCode the code passed to the server from the client
 */
export const trySignin = async (
	schema: Schema,
	username: string,
	password: string,
	recaptchaCode: string
): Promise<SigninResult> => {
	if (!(await verifyCaptcha(recaptchaCode))) {
		throw new Error('Could not verify reCAPTCHA');
	}

	const valid = await checkIfPasswordValid(schema, username, password);
	if (valid !== PasswordResult.VALID) {
		return {
			result:
				valid === PasswordResult.INVALID
					? MemberCreateError.INCORRRECT_CREDENTIALS
					: MemberCreateError.PASSWORD_EXPIRED
		};
	}

	const [member, userInformation] = await Promise.all([
		getUserID(schema, username),
		getInformationForUser(schema, username)
	]);

	const session = await createSessionForUser(schema, userInformation);

	return {
		result: MemberCreateError.NONE,
		member,
		sessionID: session.sessionID
	};
};
