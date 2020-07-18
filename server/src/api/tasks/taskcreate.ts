import { ServerAPIEndpoint } from 'auto-client-api';
import { api, Permissions, SessionType } from 'common-lib';
import { createTask, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.tasks.CreateTask> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	PAM.checkPermissions('AssignTasks')(Permissions.AssignTasks.YES)()(request).flatMap(req =>
		createTask(req.mysqlx)(req.account)(req.body)
	)
);

export default func;
