import apiGenerator from 'apis';
import { fetchFunction } from './isofetch';

export const fetchApi = apiGenerator(fetchFunction);
export default fetchApi;

export const fetchAPIForAccount = (accountID: string) => {
	return apiGenerator((url: RequestInfo, opts?: RequestInit) => {
		const newUrl = `${window.location.protocol}//${accountID}.${
			process.env.NODE_ENV === 'development' ? 'localcapunit' : 'capunit'
		}.com${process.env.NODE_ENV === 'development' ? ':3001' : ''}${
			typeof url === 'string' ? (!url.startsWith('/') ? `/${url}` : url) : url.url
		}`;

		return fetchFunction(newUrl, opts);
	});
};
