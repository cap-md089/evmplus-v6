import { ServerAPIEndpoint } from 'auto-client-api';
import { api, destroy, SessionType } from 'common-lib';
import { deleteTeam, getTeam, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.team.DeleteTeam> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
			.flatMap(deleteTeam(req.mysqlx)(req.account)(req.memberUpdateEmitter))
			.map(destroy)
	)
);

export default func;
