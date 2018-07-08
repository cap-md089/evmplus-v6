/// <reference path="../whatwg-fetch.d.ts" />

import * as fetch2 from 'isomorphic-fetch';
import 'whatwg-fetch';

// import { APIURL } from '../../../src/types';

export default function (url: string, options: RequestInit = {}): Promise<Response> {
	let promise;
	if (process && process.env && process.env.NODE_ENV === 'test') {
		promise = fetch2('http://localhost:3001' + url, options);
	} else {
		promise = fetch(url, options);
	}
	return promise.then(res => res.ok ? Promise.resolve(res) : Promise.reject(res));
}
