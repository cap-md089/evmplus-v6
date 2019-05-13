import { NewTaskObject, TaskObject } from 'common-lib';
import Task from '../../lib/Task';
import { asyncErrorHandler, json } from '../../lib/Util';
import { MemberValidatedRequest } from '../../lib/validator/Validator';

export default asyncErrorHandler(async (req: MemberValidatedRequest<NewTaskObject>, res) => {
	const task = await Task.Create(req.body, req.member, req.account, req.mysqlx);

	json<TaskObject>(res, task.toRaw());
});
