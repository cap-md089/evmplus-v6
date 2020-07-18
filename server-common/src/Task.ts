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
	task: NewTaskObject
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
	id: number
): ServerEither<TaskObject> =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not get task')
	).flatMap(
		getOneOfIDA<TaskObject>({
			id,
			accountID: account.id,
		})
	);

export const getSentTasks = (schema: Schema) => (account: AccountObject) => (
	sender: MemberReference
) =>
	asyncRight(schema.getCollection<TaskObject>('Tasks'), errorGenerator('Could not get tasks'))
		.map(
			findAndBindC<TaskObject>({ accountID: account.id, tasker: toReference(sender) })
		)
		.map(generateResults);

export const getTasksForMember = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference
) =>
	asyncRight(schema.getCollection<TaskObject>('Tasks'), errorGenerator('Could not get tasks'))
		.map(
			findAndBindC<TaskObject>({ accountID: account.id })
		)
		.map(generateResults)
		.map(
			asyncIterFilter(task => task.results.map(get('tasked')).some(areMembersTheSame(member)))
		);

export const deleteTask = (schema: Schema) => (task: TaskObject) =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not delete task')
	).flatMap(deleteFromCollectionA(task));

export const saveTask = (schema: Schema) => (task: TaskObject) =>
	asyncRight(
		schema.getCollection<TaskObject>('Tasks'),
		errorGenerator('Could not save task')
	).flatMap(saveItemToCollectionA(task));
