/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import fetch2 from 'isomorphic-fetch';
import 'whatwg-fetch';

// import { APIURL } from '../../../src/types';

export const fetchFunction: (
	url: RequestInfo | string,
	options?: RequestInit,
) => Promise<Response> =
	process.env.NODE_ENV === 'test'
		? (url: string | RequestInfo, options: RequestInit = {}) =>
				fetch2('http://localhost:3001' + url, options)
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
export default async function(url: string, options: RequestInit = {}): Promise<Response> {
	const promise = fetchFunction(url, options);

	const res = await promise;

	if (res.ok) {
		return res;
	} else {
		throw res;
	}
}
