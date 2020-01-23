import { api, either, EitherObj } from 'common-lib';
import MemberBase from './Members';
import myFetch from './myFetch';

/**
 * Base class to help handle transmission and tokens
 */
export default abstract class APIInterface<T> {
	/**
	 * Requests a token on the account for the member provided
	 *
	 * This token lasts for 1 use, and is required to be required for
	 * all POST, PUT and DELETE operations
	 *
	 * @param accountID The account to get the token for
	 * @param member The member to get a token for
	 */
	public static async getToken(accountID: string, member: MemberBase): Promise<string> {
		return this.getTokenForSession(accountID, member.sessionID);
	}

	public static async getTokenForSession(accountID: string, sessionID: string): Promise<string> {
		const uri =
			APIInterface.ENV === 'production' || APIInterface.ENV === 'staging'
				? `https://${accountID}.${APIInterface.REQUEST_URI}/`
				: '/';

		const response = await myFetch(`${uri}api/token`, {
			headers: {
				authorization: sessionID
			}
		});

		const json = either((await response.json()) as EitherObj<api.HTTPError, string>);

		if (json.isLeft()) {
			throw new Error(json.value.message);
		} else {
			return json.value;
		}
	}

	protected static ENV: 'production' | 'staging' | 'test' | 'development' = 'development';
	/**
	 * Set where to send requests to
	 */
	protected static REQUEST_URI =
		APIInterface.ENV === 'production'
			? 'capunit.com'
			: APIInterface.ENV === 'staging'
			? 'capunitdev.com'
			: 'localcapunit.com:3001';

	public constructor(public accountID: string) {}

	/**
	 * In production it uses a full URL, for testing it will only use
	 * an absolute url to the server
	 *
	 * @param components The URI parts
	 */
	public buildURI(...components: string[]): string {
		let uri =
			process.env.NODE_ENV === 'production'
				? `https://${this.accountID}.${APIInterface.REQUEST_URI}/`
				: '/';

		for (const i in components) {
			if (components.hasOwnProperty(i)) {
				uri += components[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}

	/**
	 * A simple method to allow for calling myFetch and allowing for authentication
	 *
	 * @param uri The uri to request to
	 * @param options Fetch options
	 * @param member A member that can be used to set the session ID for the
	 * 		request
	 */
	public fetch(uri: string, options: RequestInit = {}, member?: MemberBase | null) {
		if (uri[0] === '/') {
			uri = uri.slice(1);
		}

		if (uri.split('/').length > 3 && uri.split(':').length === 2) {
			uri = uri
				.split('/')
				.slice(3)
				.join('/');
		}

		let headers = options.headers || {};

		if (options.body !== undefined) {
			headers = {
				...headers,
				'content-type': 'application/json'
			};
		}

		if (member) {
			headers = {
				...headers,
				authorization: member.sessionID
			};
		}

		options.headers = headers;

		if (options.body && !options.method) {
			options.method = 'POST';
		}

		return myFetch(this.buildURI.apply(this, uri.split('/')), options);
	}

	/**
	 * All sub classes have to use this method, to mirror the server
	 */
	public abstract toRaw(): T;

	/**
	 * Similar to APIInterface#GetToken, except bound to an account
	 *
	 * @param member The member to get a token for
	 */
	protected getToken(member: MemberBase) {
		return APIInterface.getToken(this.accountID, member);
	}
}
