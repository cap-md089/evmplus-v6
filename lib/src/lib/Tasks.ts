import { TaskObject, User } from '../typings/types';
import { areMembersTheSame, hasPermission } from './Member';
import { get } from './Util';

export const hasPermissionForTask = (member: User) => (task: TaskObject) =>
	hasPermission('AssignTasks')()(member) ||
	areMembersTheSame(member)(task.tasker) ||
	task.results.map(get('tasked')).some(areMembersTheSame(member));
