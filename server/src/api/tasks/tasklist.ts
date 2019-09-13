import { TaskObject } from 'common-lib';
import {
	asyncErrorHandler,
	MemberRequest,
	streamAsyncGeneratorAsJSONArrayTyped,
	Task
} from '../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest, res) => {
	await streamAsyncGeneratorAsJSONArrayTyped<Task, TaskObject>(res, req.member.getTasks(), val =>
		val.toRaw()
	);
});
