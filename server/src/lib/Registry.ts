import { Schema } from '@mysql/xdevapi';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class Registry implements DatabaseInterface<RegistryValues> {
	public static async Get(
		account: Account,
		schema: Schema
	): Promise<Registry> {
		const registryCollection = schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		const results = await collectResults(
			findAndBind(registryCollection, {
				accountID: account.id
			})
		);

		if (results.length > 1) {
			throw new Error('Cannot get the registry values for an account');
		}

		if (results.length === 0) {
			return Registry.Create(account, schema);
		}

		return new Registry(results[0], account, schema);
	}

	private static collectionName = 'Registry';

	private static async Create(
		account: Account,
		schema: Schema
	): Promise<Registry> {
		const registryValues: RegistryValues = {
			Contact: {
				FaceBook: null,
				Flickr: null,
				Instagram: null,
				LinkedIn: null,
				MailingAddress: null,
				MeetingAddress: null,
				Twitter: null,
				YouTube: null
			},
			Website: {
				Name: '',
				Separator: ' - '
			},
			accountID: account.id,
			id: account.id
		};

		const registryCollection = schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		// tslint:disable-next-line:variable-name
		const _id = (await registryCollection
			.add(registryValues)
			.execute()).getGeneratedIds()[0];

		return new Registry(
			{
				...registryValues,
				_id
			},
			account,
			schema
		);
	}

	public values: RegistryValues = {} as RegistryValues;

	public get accountID(): string {
		return this.account.id;
	}

	public get id(): string {
		return this.accountID;
	}

	private account: Account;

	private schema: Schema;

	private constructor(
		values: RegistryValues,
		account: Account,
		schema: Schema
	) {
		this.set(values);

		this.account = account;
		this.schema = schema;
	}

	/**
	 * Updates the values in a secure manner
	 * 
	 * TODO: Implement actual type checking, either return false or throw an error on failure
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<RegistryValues>): boolean {
		for (const i in values) {
			if (values.hasOwnProperty(i)) {
				const key = i as keyof RegistryValues;
				this.values[key] = values[key];
			}
		}

		return true;
	}

	public async save() {
		const registryCollection = this.schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		await registryCollection.replaceOne(this.values._id, this.values);
	}

	public async delete() {
		const registryCollection = this.schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		await registryCollection.removeOne(this.values._id);
	}

	public toRaw = (): RegistryValues => ({
		...this.values,
		accountID: this.account.id,
		id: this.account.id
	});
}
