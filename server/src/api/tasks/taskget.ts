import { left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Task } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string }>) => {
	const id = parseInt(req.params.id, 10);

	if (id !== id) {
		return left({
			code: 400,
			error: none<Error>(),
			message: 'Invalid ID passed as parameter'
		});
	}

	let task: Task;

	try {
		task = await Task.Get(id, req.account, req.mysqlx);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find task'
		});
	}

	return right(task.toRaw());
});
