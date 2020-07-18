import { ServerAPIEndpoint } from 'auto-client-api';
import { api, hasPermissionForTask, SessionType } from 'common-lib';
import { getTask, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.tasks.GetTask> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTask(req.mysqlx)(req.account)(parseInt(req.params.id, 10)).filter(
		hasPermissionForTask(req.member),
		{
			type: 'OTHER',
			code: 403,
			message: 'Member is not able to view the requested task',
		}
	)
);

export default func;
