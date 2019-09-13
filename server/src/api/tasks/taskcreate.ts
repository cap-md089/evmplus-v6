import { NewTaskObject, TaskObject } from 'common-lib';
import { Task } from '../../lib/internals';
import { asyncErrorHandler, json } from '../../lib/internals';
import { MemberValidatedRequest } from '../../lib/internals';

export default asyncErrorHandler(async (req: MemberValidatedRequest<NewTaskObject>, res) => {
	const task = await Task.Create(req.body, req.member, req.account, req.mysqlx);

	json<TaskObject>(res, task.toRaw());
});
