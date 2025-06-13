/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIRequest } from 'auto-client-api';
import { api, destroy, hasPermissionForTask, RawTaskObject, SessionType } from 'common-lib';
import { Backends, getCombinedTasksBackend, PAM, TaskBackend, withBackends } from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

const mergeRequestBody = (req: APIRequest<api.tasks.EditTask>) => (task: RawTaskObject) => ({
	...task,
	...req.body,
});

export const func: Endpoint<Backends<[TaskBackend]>, api.tasks.EditTask> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getTask(req.account)(parseInt(req.params.id, 10))
			.filter(hasPermissionForTask(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to modify the task',
			})
			.map(mergeRequestBody(req))
			.flatMap(backend.saveTask)
			.map(destroy)
			.map(wrapper),
	);

export default withBackends(func, getCombinedTasksBackend());
