import fetch2 from 'isomorphic-fetch';
import 'whatwg-fetch';

// import { APIURL } from '../../../src/types';

export const fetchFunction =
	process && process.env && process.env.NODE_ENV === 'test'
		? (url: string, options: RequestInit = {}) => fetch2('http://localhost:3001' + url, options)
		: fetch;

/**
 * Allows for a simple way to perform a universal request
 *
 * If called in a testing environment it will go to a server running on port 3001,
 * if run anywhere else it functions like the regular fetch function
 *
 * @param url The url to go to
 * @param options The options for a request
 */
// export default function(url: string, options: RequestInit = {}, continueOnFail = false): Promise<Response> {
// 	let promise;
// 	if (process && process.env && process.env.NODE_ENV === 'test') {
// 		promise = fetch2('http://localhost:3001' + url, options);
// 	} else {
// 		promise = fetch(url, options);
// 	}
// 	return promise.then(res => (res.ok && continueOnFail ? Promise.resolve(res) : Promise.reject(res)));
// }
export default async function(url: string, options: RequestInit = {}): Promise<Response> {
	const promise = fetchFunction(url, options);

	const res = await promise;

	if (res.ok) {
		return res;
	} else {
		throw res;
	}
}
