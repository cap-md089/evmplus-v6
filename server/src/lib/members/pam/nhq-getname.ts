import { load } from 'cheerio';
import getCAPID from './nhq-getcapid';
import req from './nhq-request';

export default async (
	cookie: string,
	username: string
): Promise<{
	rank: string;
	seniorMember: boolean;
	squadron: string;
	capid: number;
	nameFirst: string;
	nameMiddle: string;
	nameLast: string;
	nameSuffix: string;
	name: string;
	orgid: number;
}> => {
	const body = await req(
		'/CAP.eServices.Web/MyAccount/GeneralInfo.aspx',
		cookie
	);

	const $ = load(body);

	const nameFirst = $('#txtFirstName').val();
	const nameMiddle = $('#txtMI').val();
	const nameLast = $('#txtLastName').val();
	const nameSuffix = $('#txtSuffix').val();

	const rank = $('#txtRank').val();

	const seniorMember = $('#txtType').val() !== 'Cadet';

	const squadron = $('#txtSquadron').val();

	const name = [nameFirst, nameMiddle, nameLast, nameSuffix]
		.filter(x => x !== '' && typeof x !== 'undefined' && x !== null)
		.join(' ');

	const { capid, orgid } = await getCAPID(`${rank} ${name}`, cookie, username.toString());

	return {
		nameFirst,
		nameLast,
		nameMiddle,
		nameSuffix,
		rank,
		seniorMember,
		squadron,
		name,
		capid,
		orgid
	};
};
