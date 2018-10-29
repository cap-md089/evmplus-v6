import myFetch from './myFetch';

export default class APIInterface {
	protected static REQUEST_URI =
		process.env.NODE_ENV === 'production'
			? 'capunit.com'
			: 'localcapunit.com';

	public constructor(private accountID: string) {}

	public buildURI(...components: string[]): string {
		let uri = `https://${this.accountID}.${APIInterface.REQUEST_URI}/`;

		for (const i in components) {
			if (components.hasOwnProperty(i)) {
				uri += components[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}

	public fetch(uri: string, options: RequestInit = {}) {
		if (uri[0] === '/') {
			uri = uri.slice(1);
		}

		return myFetch(this.buildURI.apply(this, uri.split('/')), options);
	}
}
