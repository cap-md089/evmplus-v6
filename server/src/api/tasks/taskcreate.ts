import { api, asyncRight, NewTaskObject } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	serverErrorGenerator,
	Task
} from '../../lib/internals';

export default asyncEitherHandler<api.tasks.Create>(
	(req: BasicMemberValidatedRequest<NewTaskObject>) =>
		asyncRight(
			Task.Create(req.body, req.member, req.account, req.mysqlx),
			serverErrorGenerator('Could not create task')
		)
);
