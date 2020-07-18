import { ServerAPIEndpoint } from 'auto-client-api';
import { api } from 'common-lib';
import { getEvent, getFullEventObject } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Get> = req =>
	getEvent(req.mysqlx)(req.account)(req.params.id).flatMap(
		getFullEventObject(req.mysqlx)(req.account)(req.member)
	);

export default func;
