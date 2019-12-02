import { HTTPRequestMethod, RawAuditLogItem } from 'common-lib';
import { NextFunction, Response } from 'express';
import { ConditionalMemberRequest } from './internals';

export default (req: ConditionalMemberRequest, res: Response, next: NextFunction) => {
	const item: RawAuditLogItem = {
		accountID: req.account.id,
		actor: req.member ? req.member.getReference() : { type: 'Null' },
		method: req.method as HTTPRequestMethod,
		target: req._originalUrl,
		timestamp: Date.now()
	};

	const audits = req.mysqlx.getCollection<RawAuditLogItem>('Audits');

	// Don't wait for it to finish, it's not necessary
	audits
		.add(item)
		.execute()
		.catch(e => console.error('Failed to save audit: ', e));

	next();
};
