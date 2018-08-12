import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import { collectResults } from '../../lib/MySQLUtil';
import { json } from '../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	if (!req.account) {
		res.status(400);
		res.end();
		return;
	}

	const eventsCollection = req.mysqlx.getCollection<EventObject>('Events');

	const events = await collectResults(
		eventsCollection
			.find('accountID = :accountID')
			.bind('accountID', req.account.id)
	);

	json<EventObject[]>(res, events);
};
