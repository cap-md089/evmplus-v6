import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Registry from '../../lib/Registry';
import { asyncErrorHandler } from '../../lib/Util';
import { RegistryValues } from 'common-lib';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<RegistryValues>>,
		res: Response
	) => {
		let registry: Registry;

		registry = await Registry.Get(req.account, req.mysqlx);

		registry.set(req.body);

		await registry.save();

		res.status(204);
		res.end();
	}
);
