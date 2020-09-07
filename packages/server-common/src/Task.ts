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

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	areMembersTheSame,
	asyncIterFilter,
	asyncRight,
	errorGenerator,
	get,
	MemberReference,
	NewTaskObject,
	TaskObject,
	toReference,
} from 'common-lib';
import {
	addToCollection,
	deleteFromCollectionA,
	findAndBindC,
	generateResults,
	getNewID,
	getOneOfIDA,
	saveItemToCollectionA,
} from './MySQLUtil';
import { ServerEither } from './servertypes';

export const createTaskFunc = (now = Date.now) => (schema: Schema) => (account: AccountObject) => (
	task: NewTaskObject,
) =>
	asyncRight(schema.getCollection<TaskObject>('Tasks'), errorGenerator('Could not create tasks'))
		.flatMap(getNewID(account))
		.map<TaskObject>(id => ({
			id,
			results: task.tasked.map(tasked => ({
				done: false,
				tasked,
			})),
			accountID: account.id,
			archived: false,
			assigned: Date.now(),
			description: task.description,
			name: task.name,
			tasker: task.tasker,
		}))
		.flatMap(addToCollection(schema.getCollection<TaskObject>('Tasks')));

export const createTask = createTaskFunc();

export const getTask = (schema: Schema) => (account: AccountObject) => (
	id: number,
): ServerEither<TaskObject> =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not get task'),
	).flatMap(
		getOneOfIDA<TaskObject>({
			id,
			accountID: account.id,
		}),
	);

export const getSentTasks = (schema: Schema) => (account: AccountObject) => (
	sender: MemberReference,
) =>
	asyncRight(schema.getCollection<TaskObject>('Tasks'), errorGenerator('Could not get tasks'))
		.map(
			findAndBindC<TaskObject>({ accountID: account.id, tasker: toReference(sender) }),
		)
		.map(generateResults);

export const getTasksForMember = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
) =>
	asyncRight(schema.getCollection<TaskObject>('Tasks'), errorGenerator('Could not get tasks'))
		.map(
			findAndBindC<TaskObject>({ accountID: account.id }),
		)
		.map(generateResults)
		.map(
			asyncIterFilter(task =>
				task.results.map(get('tasked')).some(areMembersTheSame(member)),
			),
		);

export const deleteTask = (schema: Schema) => (task: TaskObject) =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not delete task'),
	).flatMap(deleteFromCollectionA(task));

export const saveTask = (schema: Schema) => (task: TaskObject) =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not save task'),
	).flatMap(saveItemToCollectionA(task));
