import req from './nhq-request';
import { load } from 'cheerio';

export default async (namerank: string, cookie: string) => {
	let page = await req('/preview/GatherEmails.aspx?t=a', cookie);

	const $ = load(page);

	const table = $('#gvEmails');

	let capid = 0;
	let testNR = namerank.replace(/ /g, '');

	table.find('tr').each(function () {
		let texts = $(this).children().map(function () {
			return $(this).text().replace(/[ \n\r]/g, '');
		}).get();

		if (texts[2] === testNR) {
			capid = parseInt(texts[1], 10);
		}
	});

	return capid;
};