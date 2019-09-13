import * as express from 'express';
import { AccountRequest, asyncErrorHandler, Registry } from '../../lib/internals';

export default asyncErrorHandler(
	async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
		let registry: Registry;

		registry = await Registry.Get(req.account, req.mysqlx);

		res.json(registry.toRaw());
	}
);
