import { HTTPRequestMethod, Maybe, RawAuditLogItem } from 'common-lib';
import { NextFunction, Response } from 'express';
import { PAM } from 'server-common';

export default (
	req: PAM.BasicMaybeMemberRequest | PAM.BasicMemberRequest,
	res: Response,
	next: NextFunction
) => {
	const item: RawAuditLogItem = {
		accountID: req.account.id,
		actor: 'hasValue' in req.member ? req.member : Maybe.some(req.member),
		method: req.method as HTTPRequestMethod,
		target: req._originalUrl,
		timestamp: Date.now(),
	};

	const audits = req.mysqlx.getCollection<RawAuditLogItem>('Audits');

	// Don't wait for it to finish, it's not necessary
	audits
		.add(item)
		.execute()
		.catch(e => console.error('Failed to save audit: ', e));

	next();
};
