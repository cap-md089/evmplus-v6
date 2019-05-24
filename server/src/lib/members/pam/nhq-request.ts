import * as rp from 'request-promise-native';

export const USERAGENT = 'CAPUnitBot/3.1-alpha';

export default (url: string, cookies: string, simple: boolean = true, followRedirect = false) => {
	if (!url.match(/http\:\/\/www\.capnhq\.gov\//)) {
		url = `https://www.capnhq.gov${url}`;
	}
	console.log({
		followRedirect,
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'en-US,en;q=0.5',
			'Connection': 'keep-alive',
			'Cookie': cookies,
			'Host': 'www.capnhq.gov',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': USERAGENT,
		},
		resolveWithFullResponse: !simple,
		simple
	});
	return rp(url, {
		followRedirect,
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'en-US,en;q=0.5',
			'Connection': 'keep-alive',
			'Cookie': cookies,
			'Host': 'www.capnhq.gov',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': USERAGENT,
		},
		resolveWithFullResponse: !simple,
		simple
	});
};
