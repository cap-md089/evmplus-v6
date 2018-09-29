import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import Registry from '../../lib/Registry';

export default async (req: AccountRequest, res: express.Response) => {
	let registry: Registry;

	try {
		registry = await Registry.Get(req.account, req.mysqlx);
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.json(registry.toRaw());
};
