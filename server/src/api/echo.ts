import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncRight, errorGenerator } from 'common-lib';

export const func: ServerAPIEndpoint<api.Echo> = req => {
	return asyncRight(req.body, errorGenerator('What?'));
};

export default func;
