import { APIRequest, ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	destroy,
	errorGenerator,
	MemberReference,
	parseStringMemberReference,
	SessionType,
} from 'common-lib';
import { getTeam, PAM, removeMemberFromTeam, saveTeam } from 'server-common';

const removeMemberFromTeamWithRequest = (req: APIRequest<api.team.members.DeleteTeamMember>) => (
	ref: MemberReference
) =>
	getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.map(removeMemberFromTeam(req.account)(req.memberUpdateEmitter)(ref))
		.flatMap(saveTeam(req.mysqlx));

export const func: ServerAPIEndpoint<api.team.members.DeleteTeamMember> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		asyncEither(
			parseStringMemberReference(req.params.memberid),
			errorGenerator('Could not remove member from team')
		)
			.flatMap(removeMemberFromTeamWithRequest(req))
			.map(destroy)
	)
);

export default func;
