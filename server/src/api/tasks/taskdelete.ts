import { ServerAPIEndpoint } from 'auto-client-api';
import { api, hasPermissionForTask, SessionType } from 'common-lib';
import { deleteTask, getTask, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.tasks.DeleteTask> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTask(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.filter(hasPermissionForTask(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to delete the specified task',
		})
		.flatMap(deleteTask(req.mysqlx))
);

export default func;
