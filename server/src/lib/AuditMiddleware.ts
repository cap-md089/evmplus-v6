/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

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
