import { load } from 'cheerio';
import req from './nhq-request';

export default async (namerank: string, cookie: string, username: string): Promise<{
	capid: number,
	orgid: number
}> => {
	const page = await req('/CAP.eServices.Web/GatherEmails.aspx?t=a', cookie);

	const $ = load(page);

	let capid = 0;
	if (!username.match(/\d{6}/)) {
		const table = $('#gvEmails');

		const testNR = namerank.replace(/ /g, '');

		table.find('tr').each(function () {
			// @ts-ignore
			const texts = $(this).children().map(function () {
				// @ts-ignore
				return $(this).text().replace(/[ \n\r]/g, '');
			}).get();

			if (texts[2] === testNR) {
				capid = parseInt(texts[1], 10);
			}
		});
	} else {
		capid = parseInt(username, 10);
	}

	const menu = $('#apps-menu');

	let orgid: number;

	const href = $($($($($(menu.children()[14]).children()[1]).children()).children()[7]).children()[0]).attr('href');
	orgid = parseInt((href.match(/OID=(\d*)/) || [])[1], 10);

	return {
		capid: capid!,
		orgid: orgid!
	};
};