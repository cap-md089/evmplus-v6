import { ServerAPIEndpoint } from 'auto-client-api';
import { api, SessionType } from 'common-lib';
import { getTasksForMember, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.tasks.ListTasks> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req => getTasksForMember(req.mysqlx)(req.account)(req.member));

export default func;
