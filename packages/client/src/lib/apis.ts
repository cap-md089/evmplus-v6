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

import apiGenerator from 'apis';
import { fetchFunction } from './isofetch';

export type TFetchAPI = typeof fetchApi;

export const fetchApi = apiGenerator(fetchFunction);
export default fetchApi;

export const fetchAPIForAccount = (accountID: string): TFetchAPI =>
	apiGenerator((url: RequestInfo, opts?: RequestInit) => {
		const newUrl = `${window.location.protocol}//${accountID}.${
			process.env.NODE_ENV === 'development' ? 'localevmplus' : 'evmplus'
		}.org${process.env.NODE_ENV === 'development' ? ':3001' : ''}${
			typeof url === 'string' ? (!url.startsWith('/') ? `/${url}` : url) : url.url
		}`;
		return fetchFunction(newUrl, opts);
	});
