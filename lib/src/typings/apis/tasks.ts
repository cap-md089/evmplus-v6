import { APIEither } from '../../typings/api';
import { NewTaskObject, RawTaskObject, TaskObject } from '../../typings/types';

export interface CreateTask {
	(params: {}, body: NewTaskObject): APIEither<TaskObject>;

	url: '/api/tasks';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetTask {
	(params: { id: string }, body: {}): APIEither<TaskObject>;

	url: '/api/tasks/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface ListTasks {
	(params: {}, body: {}): APIEither<TaskObject[]>;

	url: '/api/tasks';

	method: 'get';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface EditTask {
	(params: { id: string }, body: RawTaskObject): APIEither<void>;

	url: '/api/tasks/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface DeleteTask {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/tasks/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
