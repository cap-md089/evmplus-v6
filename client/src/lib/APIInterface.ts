import myFetch from './myFetch';
import MemberBase from './Members';

export default abstract class APIInterface<T> {
	protected static REQUEST_URI =
		process.env.NODE_ENV === 'production'
			? 'capunit.com'
			: 'localcapunit.com:3001';

	public constructor(public accountID: string) {}

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

	public fetch(
		uri: string,
		options: RequestInit = {},
		member?: MemberBase | null
	) {
		if (uri[0] === '/') {
			uri = uri.slice(1);
		}

		let headers = options.headers || {};

		if (options.body) {
			headers['content-type'] = 'application/json';
		}

		if (member) {
			headers = {
				...options.headers,
				authorization: member.sessionID
			};
		}

		return myFetch(this.buildURI.apply(this, uri.split('/')), {
			...options,
			headers
		});
	}

	public abstract toRaw(): T;
}
