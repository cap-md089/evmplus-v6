import * as rp from 'request-promise-native';

export default async (url: string, cookies: string, simple: boolean = true) => {
	if (!url.match(/http\:\/\/www\.capnhq\.gov\//)) {
		url = `https://www.capnhq.gov${url}`;
	}
	return rp(url, {
		followRedirect: false,
		simple,
		headers: {
			'Cookie': cookies,
			'Host': 'www.capnhq.gov',
			'User-Agent': 'EventManagementLoginBot/2.0',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		}
	});
};