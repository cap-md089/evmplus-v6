import { Schema } from '@mysql/xdevapi';
import {
	DatabaseInterface,
	MemberReference,
	NewTaskObject,
	NoSQLDocument,
	RawTaskObject,
	TaskObject,
	TaskRecipientsResults
} from 'common-lib';
import Account from './Account';
import MemberBase from './Members';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';
import NewTaskObjectValidator from './validator/validators/NewTaskObject';
import RawTaskObjectValidator from './validator/validators/RawTaskObject';

export default class Task implements TaskObject, DatabaseInterface<TaskObject> {
	public static Validator = NewTaskObjectValidator;
	public static RawValidator = RawTaskObjectValidator;

	public static async Get(id: number, account: Account, schema: Schema) {
		const taskCollection = schema.getCollection<TaskObject & Required<NoSQLDocument>>('Tasks');

		const results = await collectResults(
			findAndBind(taskCollection, {
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get task');
		}

		return new Task(results[0], account, schema);
	}

	public static async Create(
		data: NewTaskObject,
		member: MemberBase,
		account: Account,
		schema: Schema
	) {
		const tasksCollection = schema.getCollection<TaskObject>('Tasks');

		const idGenerator = await generateResults(
			findAndBind(tasksCollection, {
				accountID: account.id
			})
		);

		let id = 0;

		for await (const task of idGenerator) {
			id = Math.max(id, task.id);
		}

		id++;

		const assigned = Date.now();

		const results = data.tasked.map(ref => ({
			done: false,
			tasked: ref,
			comments: ''
		}));

		const newTask: TaskObject = {
			accountID: account.id,
			archived: false,
			assigned,
			description: data.description,
			id,
			name: data.name,
			results,
			tasker: data.tasker
		};

		// tslint:disable-next-line:variable-name
		const _id = (await tasksCollection.add(newTask).execute()).getGeneratedIds()[0];

		return new Task(
			{
				...newTask,
				_id
			},
			account,
			schema
		);
	}

	// tslint:disable-next-line:variable-name
	public _id: string;

	public get accountID() {
		return this.account.id;
	}

	public archived: boolean = false;

	public assigned: number = 0;

	public description: string = '';

	public id: number = 0;

	public name: string = '';

	public results: TaskRecipientsResults[] = [];

	public tasker: MemberReference;

	public constructor(
		data: TaskObject & Required<NoSQLDocument>,
		private account: Account,
		private schema: Schema
	) {
		this._id = data._id;
		this.archived = data.archived;
		this.description = data.description;
		this.id = data.id;
		this.name = data.name;
		this.results = data.results;
		this.tasker = data.tasker;
	}

	public async save() {
		const taskCollection = this.schema.getCollection<TaskObject>('Tasks');

		await taskCollection.replaceOne(this._id, this.toRaw());
	}

	public toRaw() {
		return {
			accountID: this.accountID,
			archived: this.archived,
			assigned: this.assigned,
			description: this.description,
			id: this.id,
			name: this.name,
			results: this.results,
			tasker: this.tasker
		};
	}

	public set(values: Partial<RawTaskObject>) {
		if (RawTaskObjectValidator.validate(values, true)) {
			RawTaskObjectValidator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(RawTaskObjectValidator.getErrorString());
		}
	}

	public async delete(): Promise<void> {
		const taskCollection = this.schema.getCollection<TaskObject>('Tasks');

		await taskCollection.removeOne(this._id);
	}
}
