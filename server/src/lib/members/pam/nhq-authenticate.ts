import * as rp from 'request-promise-native';

import * as cheerio from 'cheerio';

const GET_SIGNIN_VALUES_URL = 'https://www.capnhq.gov/CAP.eServices.Web/default.aspx';
const SIGNIN_URL = GET_SIGNIN_VALUES_URL;

export default async (Login1$UserName: string, Login1$Password: string): Promise<string> => {
	let page = await rp(GET_SIGNIN_VALUES_URL);

	let $ = cheerio.load(page);

	let form = {
		__LASTFOCUS: '',
		__VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
		__EVENTTARGET: '',
		__EVENTARGUMENT: '',
		__EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
		__VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val(),
		Login1$UserName,
		Login1$Password,
		Login1$LoginButton: 'Sign+in'
	};

	let results = await rp(SIGNIN_URL, {
		form,
		method: 'POST',
		simple: false,
		resolveWithFullResponse: true,
		followRedirect: false,
		headers: {
			host: 'www.capnhq.gov',
			'User-Agent': 'EventManagementLoginBot/3.0',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
			'Accept-Language': 'en-us,en;q=0.5',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		}
	});

	if (results.statusCode === 302) {
		if (results.headers.location.slice(0, 38) === '/CAP.eServices.Web/NL/Recover.aspx?UP=') {
			throw new Error('1');
		} else {
			let cookies = results.headers['set-cookie'].map((ctext: string) =>
				ctext.match(/(.*?\=.*?);/)[1]).join('; ');
	
			return cookies;
		}
	} else {
		throw new Error('0');
	}
};
