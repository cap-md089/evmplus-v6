import req from './nhq-request';
import { load } from 'cheerio';
import getCAPID from './nhq-getcapid';

export default async (cookie: string, username: string): Promise<{
	rank: string,
	seniorMember: boolean,
	squadron: string,
	capid: number,
	nameFirst: string,
	nameMiddle: string,
	nameLast: string,
	nameSuffix: string
}> => {
	let body = await req('/CAP.eServices.Web/MyAccount/GeneralInfo.aspx', cookie);

	let $ = load(body);

	let nameFirst = $('#txtFirstName').val();
	let nameMiddle = $('#txtMI').val();
	let nameLast = $('#txtLastName').val();
	let nameSuffix = $('#txtSuffix').val();

	let rank = $('#txtRank').val();

	let seniorMember = $('#txtType').val() !== 'Cadet';

	let squadron = $('#txtSquadron').val();

	let capid;
	if (username.match(/\d{6}/)) {
		capid = parseInt(username, 10);
	} else {
		capid = await getCAPID(`${rank} ${name}`, cookie);
	}

	return {
		rank,
		seniorMember,
		squadron,
		capid,
		nameFirst,
		nameMiddle,
		nameLast,
		nameSuffix
	};
};