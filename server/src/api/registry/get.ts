import { ServerAPIEndpoint } from 'auto-client-api';
import { api } from 'common-lib';
import { getRegistry } from 'server-common';

export const func: ServerAPIEndpoint<api.registry.GetRegistry> = req =>
	getRegistry(req.mysqlx)(req.account);

export default func;
