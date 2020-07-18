import { ServerAPIEndpoint } from 'auto-client-api';
import { api, SessionType } from 'common-lib';
import { expandTeam, getTeam, httpStripTeamObject, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.team.GetTeam> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.flatMap(expandTeam(req.mysqlx)(req.account))
		.map(httpStripTeamObject(req.member))
);

export default func;
