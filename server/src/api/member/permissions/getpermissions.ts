import { StoredMemberPermissions } from 'common-lib';
import {
	asyncErrorHandler,
	findAndBind,
	generateResults,
	MemberRequest,
	streamAsyncGeneratorAsJSONArray
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	const permissionsCollection = req.mysqlx.getCollection<StoredMemberPermissions>(
		'UserPermissions'
	);

	const generator = generateResults(
		findAndBind(permissionsCollection, { accountID: req.account.id })
	);

	streamAsyncGeneratorAsJSONArray(res, generator, val =>
		JSON.stringify({
			accountID: val.accountID,
			member: val.member,
			permissions: val.permissions
		})
	);
});
