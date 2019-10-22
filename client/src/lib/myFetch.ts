import fetch2 from 'isomorphic-fetch';
import 'whatwg-fetch';

// import { APIURL } from '../../../src/types';

/**
 * Allows for a simple way to perform a universal request
 *
 * If called in a testing environment it will go to a server running on port 3001,
 * if run anywhere else it functions like the regular fetch function
 *
 * @param url The url to go to
 * @param options The options for a request
 */
export default function(url: string, options: RequestInit = {}): Promise<Response> {
	let promise;
	if (process && process.env && process.env.NODE_ENV === 'test') {
		promise = fetch2('http://localhost:3001' + url, options);
	} else {
		promise = fetch(url, options);
	}
	return promise.then(res => (res.ok ? Promise.resolve(res) : Promise.reject(res)));
}
