import { ServerAPIEndpoint } from 'auto-client-api';
import { api, SessionType } from 'common-lib';
import { createTeam, expandTeam, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.team.CreateTeam> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		createTeam(req.memberUpdateEmitter)(req.mysqlx)(req.account)(req.body).flatMap(
			expandTeam(req.mysqlx)(req.account)
		)
	)
);

export default func;
