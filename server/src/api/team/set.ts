import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	api,
	asyncRight,
	destroy,
	errorGenerator,
	NewTeamObject,
	SessionType,
	Validator,
} from 'common-lib';
import { getTeam, PAM, saveTeam, updateTeam } from 'server-common';
import { validateRequest } from '../../lib/requestUtils';

const teamPartialValidator = Validator.Partial(
	(validator<NewTeamObject>(Validator) as Validator<NewTeamObject>).rules
);

export const func: ServerAPIEndpoint<api.team.SetTeamData> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(request =>
		validateRequest(teamPartialValidator)(request).flatMap(req =>
			getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10)).flatMap(oldTeam =>
				asyncRight(
					{
						...oldTeam,
						...req.body,
					},
					errorGenerator('Could not update team')
				)
					.map(updateTeam(req.account)(req.memberUpdateEmitter)(oldTeam))
					.map(saveTeam(req.mysqlx))
					.map(destroy)
			)
		)
	)
);

export default func;
