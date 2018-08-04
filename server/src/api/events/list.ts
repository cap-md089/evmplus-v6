import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import { prettySQL } from '../../lib/MySQLUtil';
import { json } from '../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	if (!req.account) {
		res.status(400);
		res.end();
		return;
	}

	const events = await req.connectionPool.query(
		prettySQL`
				SELECT
					*
				FROM
					EventInformation
				WHERE
					AccountID = ?
			`,
		[req.account.id]
	);

	json<EventObject[]>(res, events);
};
