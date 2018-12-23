import * as express from 'express';
import { AccountRequest } from '../../lib/Account';
import Registry from '../../lib/Registry';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(
	async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
		let registry: Registry;

		registry = await Registry.Get(req.account, req.mysqlx);

		res.json(registry.toRaw());
	}
);