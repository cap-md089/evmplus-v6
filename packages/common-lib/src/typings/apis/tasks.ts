/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents management of tasks for a member
 *
 * TODO: create an interface on the client
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../api';
import { NewTaskObject, RawTaskObject, TaskObject } from '../types';

/**
 * Assigns a task to a member
 */
export interface CreateTask {
	(params: {}, body: NewTaskObject): APIEither<TaskObject>;

	url: '/api/tasks';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Allows for getting a single task and the associated information
 */
export interface GetTask {
	(params: { id: string }, body: {}): APIEither<TaskObject>;

	url: '/api/tasks/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Lists the tasks assigned to the member of a session ID
 */
export interface ListTasks {
	(params: {}, body: {}): APIEither<TaskObject[]>;

	url: '/api/tasks';

	method: 'get';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Updates task information
 */
export interface EditTask {
	(params: { id: string }, body: RawTaskObject): APIEither<void>;

	url: '/api/tasks/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Deletes a task completely
 */
export interface DeleteTask {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/tasks/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
