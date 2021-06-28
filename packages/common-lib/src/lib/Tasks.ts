/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Permissions, TaskObject, User } from '../typings/types';
import { areMembersTheSame, hasPermission } from './Member';
import { get } from './Util';

export const hasPermissionForTask = (member: User) => (task: TaskObject): boolean =>
	hasPermission('AssignTasks')(Permissions.AssignTasks.YES)(member) ||
	areMembersTheSame(member)(task.tasker) ||
	task.results.map(get('tasked')).some(areMembersTheSame(member));
