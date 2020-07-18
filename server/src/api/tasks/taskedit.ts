import { APIRequest, ServerAPIEndpoint } from 'auto-client-api';
import { api, destroy, hasPermissionForTask, RawTaskObject, SessionType } from 'common-lib';
import { getTask, PAM, saveTask } from 'server-common';

const mergeRequestBody = (req: APIRequest<api.tasks.EditTask>) => (task: RawTaskObject) => ({
	...task,
	...req.body,
});

export const func: ServerAPIEndpoint<api.tasks.EditTask> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTask(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.filter(hasPermissionForTask(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to modify the task',
		})
		.map(mergeRequestBody(req))
		.flatMap(saveTask(req.mysqlx))
		.map(destroy)
);

export default func;
