import { TaskObject } from 'common-lib';
import { MemberRequest } from '../../lib/Members';
import Task from '../../lib/Task';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArrayTyped } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	await streamAsyncGeneratorAsJSONArrayTyped<Task, TaskObject>(res, req.member.getTasks(), val =>
		val.toRaw()
	);
});
