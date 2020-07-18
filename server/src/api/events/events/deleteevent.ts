import { ServerAPIEndpoint } from 'auto-client-api';
import { api, canManageEvent, Permissions, SessionType } from 'common-lib';
import { deleteEvent, getEvent, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.events.events.Delete> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.filter(canManageEvent(Permissions.ManageEvent.FULL)(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot perform that action',
		})
		.flatMap(deleteEvent(req.configuration)(req.mysqlx)(req.account))
);

export default func;
