import { AuditLogItem, HTTPRequestMethod } from 'common-lib';
import { asyncErrorHandler, ConditionalMemberRequest } from './internals';

export default asyncErrorHandler((req: ConditionalMemberRequest, res, next) => {
	const item: AuditLogItem = {
		accountID: req.account.id,
		actor: req.member ? req.member.getReference() : { type: 'Null' },
		method: req.method as HTTPRequestMethod,
		target: req._originalUrl,
		timestamp: Date.now()
	};

	const audits = req.mysqlx.getCollection<AuditLogItem>('Audits');

	// Don't wait for it to finish, it's not necessary
	audits.add(item).execute();

	next();
});
