import { ServerAPIEndpoint } from 'auto-client-api';
import { api, destroy, SessionType } from 'common-lib';
import { getTeam, modfiyTeamMember, PAM, saveTeam } from 'server-common';

export const func: ServerAPIEndpoint<api.team.members.ModifyTeamMember> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
			.map(modfiyTeamMember(req.body))
			.flatMap(saveTeam(req.mysqlx))
			.map(destroy)
	)
);

export default func;
