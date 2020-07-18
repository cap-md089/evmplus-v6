import { ServerAPIEndpoint, validator } from 'auto-client-api';
import { api, destroy, SessionType, Validator, RegistryValues } from 'common-lib';
import { getRegistry, PAM, saveRegistry } from 'server-common';
import { validateRequest } from '../../lib/requestUtils';

const partialRegistryValidator = Validator.Partial(
	(validator<RegistryValues>(Validator) as Validator<RegistryValues>).rules
);

export const func: ServerAPIEndpoint<api.registry.SetRegistry> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('RegistryEdit')(request =>
		validateRequest(partialRegistryValidator)(request).flatMap(req =>
			getRegistry(req.mysqlx)(req.account)
				.map(oldRegistry => ({ ...oldRegistry, ...req.body }))
				.flatMap(saveRegistry(req.mysqlx))
				.map(destroy)
		)
	)
);

export default func;
