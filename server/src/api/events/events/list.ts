import { ServerAPIEndpoint } from 'auto-client-api';
import { api, asyncRight, errorGenerator } from 'common-lib';
import { getSortedEvents } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.GetList> = req =>
	asyncRight(getSortedEvents(req.mysqlx)(req.account), errorGenerator('Could not get events'));

export default func;
