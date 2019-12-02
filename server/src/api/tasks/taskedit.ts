import { just, left, NewTaskObject, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberValidatedRequest, Task } from '../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicMemberValidatedRequest<NewTaskObject, { id: string }>) => {
		const id = parseInt(req.params.id, 10);

		if (id !== id) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid ID passed as a parameter'
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

		task.set(req.body);

		try {
			await task.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save information for task'
			});
		}

		return right(void 0);
	}
);
