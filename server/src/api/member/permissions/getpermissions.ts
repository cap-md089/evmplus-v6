import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncRight, errorGenerator, StoredMemberPermissions } from 'common-lib';
import { findAndBindC, generateResults } from 'server-common';

export const func: ServerAPIEndpoint<api.member.permissions.GetPermissions> = req =>
	asyncRight(
		req.mysqlx.getCollection<StoredMemberPermissions>('MemberPermissions'),
		errorGenerator('Could not get member permissions')
	)
		.map(
			findAndBindC<StoredMemberPermissions>({ accountID: req.account.id })
		)
		.map(generateResults);

export default func;
