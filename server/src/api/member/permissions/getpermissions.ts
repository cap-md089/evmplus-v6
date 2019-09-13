import { StoredMemberPermissions } from '../../../lib/member/pam/Account';
import { MemberRequest } from '../../../lib/Members';
import { findAndBind, generateResults } from '../../../lib/MySQLUtil';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	const permissionsCollection = req.mysqlx.getCollection<StoredMemberPermissions>(
		'UserPermissions'
	);

	const generator = generateResults(
		findAndBind(permissionsCollection, { accountID: req.account.id })
	);

	streamAsyncGeneratorAsJSONArray(res, generator);
});
