import { load } from 'cheerio';
import req from './nhq-request';

export default async (namerank: string, cookie: string) => {
	const page = await req('/preview/GatherEmails.aspx?t=a', cookie);

	const $ = load(page);

	const table = $('#gvEmails');

	let capid = 0;
	const testNR = namerank.replace(/ /g, '');

	table.find('tr').each(function () {
		const texts = $(this).children().map(function () {
			return $(this).text().replace(/[ \n\r]/g, '');
		}).get();

		if (texts[2] === testNR) {
			capid = parseInt(texts[1], 10);
		}
	});

	return capid;
};