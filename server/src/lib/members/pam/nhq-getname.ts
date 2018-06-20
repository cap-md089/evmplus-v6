import { load } from 'cheerio';
import getCAPID from './nhq-getcapid';
import req from './nhq-request';

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
	const body = await req('/CAP.eServices.Web/MyAccount/GeneralInfo.aspx', cookie);

	const $ = load(body);

	const nameFirst = $('#txtFirstName').val();
	const nameMiddle = $('#txtMI').val();
	const nameLast = $('#txtLastName').val();
	const nameSuffix = $('#txtSuffix').val();

	const rank = $('#txtRank').val();

	const seniorMember = $('#txtType').val() !== 'Cadet';

	const squadron = $('#txtSquadron').val();

	let capid;
	if (username.match(/\d{6}/)) {
		capid = parseInt(username, 10);
	} else {
		capid = await getCAPID(`${rank} ${name}`, cookie);
	}

	return {
		capid,
		nameFirst,
		nameLast,
		nameMiddle,
		nameSuffix,
		rank,
		seniorMember,
		squadron
	};
};