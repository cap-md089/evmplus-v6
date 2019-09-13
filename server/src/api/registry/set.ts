import { RegistryValues } from 'common-lib';
import { Response } from 'express';
import { asyncErrorHandler, MemberValidatedRequest, Registry } from '../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<Partial<RegistryValues>>, res: Response) => {
		let registry: Registry;

		registry = await Registry.Get(req.account, req.mysqlx);

		registry.set(req.body);

		await registry.save();

		res.status(204);
		res.end();
	}
);
