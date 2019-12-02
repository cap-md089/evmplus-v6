import { just, left, NewTaskObject, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberValidatedRequest, Task } from '../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberValidatedRequest<NewTaskObject>) => {
	try {
		const task = await Task.Create(req.body, req.member, req.account, req.mysqlx);

		return right(task.toRaw());
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not create task'
		});
	}
});
