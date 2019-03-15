import { ExtraMemberInformation, MemberReference, MemberType } from 'common-lib';
import MemberBase, { MemberRequest } from '../../../lib/Members';
import { generateResults } from '../../../lib/MySQLUtil';
import { asyncErrorHandler } from '../../../lib/Util';

const refFromInfo = (info: ExtraMemberInformation): MemberReference =>
	({
		type: info.type as Exclude<MemberType, 'Null'>,
		id: info.id
	} as MemberReference);

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	const extraMemberInformationCollection = req.mysqlx.getCollection<ExtraMemberInformation>(
		'ExtraMemberInformation'
	);

	const generator = generateResults(
		extraMemberInformationCollection
			.find(
				'accessLevel = "Staff" OR accessLevel = "Manager" OR accessLevel = "Admin" AND accountID = :accountID'
			)
			.bind('accountID', req.account.id)
	);

	res.setHeader('Content-type', 'application/json');

	let started = false;

	for await (const extraInfo of generator) {
		const ref: MemberReference = refFromInfo(extraInfo);

		const member = await MemberBase.ResolveReference(ref, req.account, req.mysqlx, false);

		if (member !== null) {
			res.write((started ? ',' : '[') + JSON.stringify(member.toRaw()));
			started = true;
		}
	}

	if (!started) {
		res.write('[');
	}

	res.write(']');
	res.end();
});
