import { TaskObject } from 'common-lib';
import { MemberRequest } from '../../lib/Members';
import Task from '../../lib/Task';
import { asyncErrorHandler, json } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	const id = parseInt(req.params.id, 10);

	if (id !== id) {
		res.status(400);
		res.end();
		return;
	}

	let task: Task;

	try {
		task = await Task.Get(id, req.account, req.mysqlx);
	} catch(e) {
		res.status(404);
		res.end();
		return;
	}

	json<TaskObject>(res, task.toRaw());
});
