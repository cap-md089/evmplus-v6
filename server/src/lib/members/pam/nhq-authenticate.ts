import * as cheerio from 'cheerio';
import { MemberCreateError } from 'common-lib/index';
import * as rp from 'request-promise-native';
import { USERAGENT } from './nhq-request';

const GET_SIGNIN_VALUES_URL = 'https://www.capnhq.gov/CAP.eServices.Web/default.aspx';
const SIGNIN_URL = GET_SIGNIN_VALUES_URL;

export default async (Login1$UserName: string, Login1$Password: string): Promise<string> => {
	const page = await rp(GET_SIGNIN_VALUES_URL);

	const $ = cheerio.load(page);

	const form = {
		Login1$LoginButton: 'Sign+in',
		Login1$Password,
		Login1$UserName,
		__EVENTARGUMENT: '',
		__EVENTTARGET: '',
		__EVENTVALIDATION: $('input[name=__EVENTVALIDATION]').val(),
		__LASTFOCUS: '',
		__VIEWSTATE: $('input[name=__VIEWSTATE]').val(),
		__VIEWSTATEGENERATOR: $('input[name=__VIEWSTATEGENERATOR]').val()
	};

	const results = await rp(SIGNIN_URL, {
		followRedirect: false,
		form,
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*,q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'en-us,en;q=0.5',
			Connection: 'keep-alive',
			Host: 'www.capnhq.gov',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': USERAGENT
		},
		method: 'POST',
		resolveWithFullResponse: true,
		simple: false
	});

	if (results.statusCode === 302) {
		if (results.headers.location.slice(0, 38) === '/CAP.eServices.Web/NL/Recover.aspx?UP=') {
			throw new Error(MemberCreateError.PASSWORD_EXPIRED.toString());
		} else {
			const cookies = results.headers['set-cookie']
				.map((ctext: string) => (ctext.match(/(.*?\=.*?);/) || [])[1])
				.join('; ');

			return cookies;
		}
	} else {
		throw new Error(MemberCreateError.INCORRRECT_CREDENTIALS.toString());
	}
};
