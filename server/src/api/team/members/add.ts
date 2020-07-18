import { APIRequest, ServerAPIEndpoint } from 'auto-client-api';
import { always, api, destroy, RawTeamObject, SessionType } from 'common-lib';
import { addMemberToTeam, getTeam, PAM, resolveReference, saveTeam } from 'server-common';

const checkIfMemberExists = (req: APIRequest<api.team.members.AddTeamMember>) => (
	team: RawTeamObject
) => resolveReference(req.mysqlx)(req.account)(req.body.reference).map(always(team));

export const func: ServerAPIEndpoint<api.team.members.AddTeamMember> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
			.flatMap(checkIfMemberExists(req))
			.map(addMemberToTeam(req.memberUpdateEmitter)(req.account)(req.body))
			.flatMap(saveTeam(req.mysqlx))
			.map(destroy)
	)
);

export default func;
