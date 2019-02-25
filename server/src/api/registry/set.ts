import { RegistryValues } from 'common-lib';
import { Response } from 'express';
import Registry from '../../lib/Registry';
import { asyncErrorHandler } from '../../lib/Util';
import { MemberValidatedRequest } from '../../lib/validator/Validator';

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
