import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncRight, errorGenerator } from 'common-lib';

export const func: ServerAPIEndpoint<api.AccountCheck> = req =>
	asyncRight(req.account, errorGenerator('What?'));

export default func;
